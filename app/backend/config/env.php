<?php
declare(strict_types=1);

function load_env_file(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmedLine = trim($line);

        if ($trimmedLine === '' || $trimmedLine[0] === '#') {
            continue;
        }

        $segments = explode('=', $trimmedLine, 2);

        if (count($segments) !== 2) {
            continue;
        }

        $key = trim($segments[0]);
        $value = trim($segments[1]);

        if ($key === '') {
            continue;
        }

        if (
            strlen($value) >= 2 &&
            (($value[0] === '"' && $value[strlen($value) - 1] === '"') ||
                ($value[0] === "'" && $value[strlen($value) - 1] === "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

function env(string $key): string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    return (string) $value;
}
