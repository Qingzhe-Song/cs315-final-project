<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/mysql.inc.php';
require_once __DIR__ . '/../backend/query_library.php';

header('Content-Type: application/json; charset=utf-8');

function send_json(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $action = $_GET['action'] ?? 'catalog';

    if ($action === 'catalog') {
        send_json(200, [
            'appTitle' => env_or_default('APP_TITLE', 'Steam Discovery Dashboard'),
            'queries' => get_query_catalog(),
        ]);
    }

    if ($action !== 'run') {
        throw new InvalidArgumentException('Unsupported API action.');
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new InvalidArgumentException('The run action requires POST.');
    }

    $rawBody = file_get_contents('php://input');
    $payload = json_decode($rawBody ?: '{}', true, 512, JSON_THROW_ON_ERROR);

    if (!is_array($payload)) {
        throw new InvalidArgumentException('Request body must be a JSON object.');
    }

    $queryId = is_string($payload['queryId'] ?? null) ? $payload['queryId'] : '';
    $input = is_array($payload['params'] ?? null) ? $payload['params'] : [];

    if ($queryId === '') {
        throw new InvalidArgumentException('A query id is required.');
    }

    $result = execute_query($db, $queryId, $input);
    $db->close();

    send_json(200, $result);
} catch (Throwable $error) {
    send_json(400, [
        'error' => $error->getMessage(),
    ]);
}
