<?php
declare(strict_types=1);

// default connection values are overridden by app/backend/.env when present.
$config = [
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3306',
    'DB_USER' => 'root',
    'DB_PASS' => '',
    'DB_NAME' => '',
    'DB_CHARSET' => 'utf8mb4',
];

$envFile = dirname(__DIR__) . '/.env';

// loads simple key=value environment lines for local database settings.
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);

        // skips blank lines, comments, and malformed entries.
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }

        // trims whitespace so env values can be written in a readable style.
        [$key, $value] = explode('=', $line, 2);
        $config[trim($key)] = trim($value);
    }
}

// creates the mysqli connection used by the api endpoint.
$db = new mysqli(
    $config['DB_HOST'],
    $config['DB_USER'],
    $config['DB_PASS'],
    $config['DB_NAME'],
    (int) $config['DB_PORT']
);

// stops startup immediately if the database cannot be reached.
if ($db->connect_error) {
    die('Connection failed: ' . $db->connect_error);
}

// keeps query results encoded consistently for titles and other text fields.
$db->set_charset($config['DB_CHARSET']);

?>
