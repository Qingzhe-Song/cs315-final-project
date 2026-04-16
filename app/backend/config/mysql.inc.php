<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

load_env_file(dirname(__DIR__) . '/.env');

$db = new mysqli(
    env_or_default('DB_HOST', 'dbase.cs.jhu.edu'),
    env_or_default('DB_USER', 'dbase_username'),
    env_or_default('DB_PASS', 'dbase_password'),
    env_or_default('DB_NAME', 'database_name'),
    (int) env_or_default('DB_PORT', '3306')
);

if ($db->connect_error) {
    die('Connection failed: ' . $db->connect_error);
}

$db->set_charset(env_or_default('DB_CHARSET', 'utf8mb4'));
