<?php
declare(strict_types=1);

function env_or_default(string $key, string $default): string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return (string) $value;
}

$autoloadPath = __DIR__ . '/vendor/autoload.php';

if (!is_file($autoloadPath)) {
    $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
}

if (!is_file($autoloadPath)) {
    die("Missing Composer dependencies. Run 'composer install' inside the app directory.");
}

require_once $autoloadPath;

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

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
