<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

load_env_file(dirname(__DIR__) . '/.env');

$db = new mysqli(
    env('DB_HOST'),
    env('DB_USER'),
    env('DB_PASS'),
    env('DB_NAME'),
    (int) env('DB_PORT')
);

if ($db->connect_error) {
    die('Connection failed: ' . $db->connect_error);
}

$db->set_charset(env('DB_CHARSET'));
