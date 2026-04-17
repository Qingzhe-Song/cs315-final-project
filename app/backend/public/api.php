<?php

function send_cors_headers()
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function send_json($statusCode, $payload)
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_request()
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $payload = json_decode($rawBody, true);

    if (!is_array($payload)) {
        throw new RuntimeException('Request body must be valid JSON.');
    }

    return $payload;
}

send_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/mysql.inc.php';
require_once __DIR__ . '/../src/query_library.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $action = $_GET['action'] ?? 'run';

    if ($action !== 'run') {
        throw new InvalidArgumentException('Unsupported action.');
    }

    $payload = read_json_request();
    $queryId = isset($payload['queryId']) ? (string) $payload['queryId'] : '';
    $params = [];

    if (isset($payload['params']) && is_array($payload['params'])) {
        $params = $payload['params'];
    }

    $result = execute_query($db, $queryId, $params);
    $db->close();

    send_json(200, $result);
} catch (Throwable $error) {
    if (isset($db) && $db instanceof mysqli) {
        $db->close();
    }

    send_json(400, [
        'error' => 'Request failed.',
        'details' => $error->getMessage(),
    ]);
}
