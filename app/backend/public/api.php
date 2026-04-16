<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

load_env_file(dirname(__DIR__) . '/.env');

function allowed_origins(): array
{
    $rawOrigins = env_or_default('CORS_ALLOW_ORIGINS', 'http://127.0.0.1:5173,http://localhost:5173');
    $origins = array_map('trim', explode(',', $rawOrigins));

    return array_values(array_filter($origins, static fn (string $origin): bool => $origin !== ''));
}

function send_cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = allowed_origins();

    if ($origin !== '' && (in_array('*', $allowedOrigins, true) || in_array($origin, $allowedOrigins, true))) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

send_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/mysql.inc.php';
require_once __DIR__ . '/../src/query_library.php';

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
