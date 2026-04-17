<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

load_env_file(dirname(__DIR__) . '/.env');

function allowed_origins(): array
{
    $rawOrigins = env('CORS_ALLOW_ORIGINS');
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
            'appTitle' => env('APP_TITLE'),
            'queries' => get_query_catalog(),
        ]);
    }

    if ($action !== 'run') {
        send_json(200, []);
    }

    $rawBody = file_get_contents('php://input');
    $payload = json_decode($rawBody ?: '{}', true) ?: [];
    $queryId = (string) ($payload['queryId'] ?? '');
    $input = $payload['params'] ?? [];

    $result = execute_query($db, $queryId, $input);
    $db->close();

    send_json(200, $result);
} catch (Throwable $error) {
    send_json(400, [
        'error' => 'Request failed.',
    ]);
}
