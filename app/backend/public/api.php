<?php

// sends browser access rules so the frontend can call this api.
function send_cors_headers()
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// returns one json response and stops the request lifecycle.
function send_json($statusCode, $payload)
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// reads and validates the json body used by query requests.
function read_json_request()
{
    $rawBody = file_get_contents('php://input');

    // treats empty request bodies as an empty parameter set.
    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $payload = json_decode($rawBody, true);

    // rejects malformed json before the query layer sees it.
    if (!is_array($payload)) {
        send_json(400, [
            'error' => 'Request failed.',
            'details' => 'Request body must be valid JSON.',
        ]);
    }

    return $payload;
}

send_cors_headers();

// answers preflight checks without running any query logic.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// all successful and error responses from this endpoint are json.
header('Content-Type: application/json; charset=utf-8');

// loads the database connection and query execution helpers.
require_once __DIR__ . '/../config/mysql.inc.php';
require_once __DIR__ . '/../src/query_library.php';

$action = $_GET['action'] ?? 'run';

// limits the endpoint to the two query modes the frontend exposes.
if (!in_array($action, ['run', 'custom'], true)) {
    send_json(400, [
        'error' => 'Request failed.',
        'details' => 'Unsupported action.',
    ]);
}

$payload = read_json_request();
$params = [];

// accepts optional form parameters without requiring every request to include them.
if (isset($payload['params']) && is_array($payload['params'])) {
    $params = $payload['params'];
}

// custom requests build sql dynamically, while preset requests call stored procedures.
if ($action === 'custom') {
    $result = execute_custom_query($db, $params);
} else {
    $queryId = isset($payload['queryId']) ? (string) $payload['queryId'] : '';
    $result = execute_query($db, $queryId, $params);
}

$db->close();

// wraps the query result in the shared json response format.
send_json(200, $result);
