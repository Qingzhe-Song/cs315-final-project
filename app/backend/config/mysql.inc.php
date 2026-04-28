<?php
declare(strict_types=1);

$config = [
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3306',
    'DB_USER' => 'root',
    'DB_PASS' => '',
    'DB_NAME' => '',
    'DB_CHARSET' => 'utf8mb4',
];

$envFile = dirname(__DIR__) . '/.env';

if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);

        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $config[trim($key)] = trim($value);
    }
}

$db = new mysqli(
    $config['DB_HOST'],
    $config['DB_USER'],
    $config['DB_PASS'],
    $config['DB_NAME'],
    (int) $config['DB_PORT']
);

if ($db->connect_error) {
    die('Connection failed: ' . $db->connect_error);
}

$db->set_charset($config['DB_CHARSET']);
