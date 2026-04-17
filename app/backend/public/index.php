<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

load_env_file(dirname(__DIR__) . '/.env');

$appTitle = env('APP_TITLE');
$frontendUrl = env('FRONTEND_URL');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($appTitle, ENT_QUOTES, 'UTF-8'); ?></title>
    <meta name="theme-color" content="#002d72">
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: linear-gradient(180deg, #f8fbff 0%, #edf4fb 100%);
            color: #0f2746;
            font-family: system-ui, sans-serif;
        }
        main {
            width: min(720px, 100%);
            padding: 32px;
            border: 1px solid #ced9e8;
            border-radius: 18px;
            background: #ffffff;
            box-shadow: 0 18px 60px rgba(0, 45, 114, 0.10);
        }
        h1 {
            margin: 0 0 12px;
            font-size: 2rem;
            line-height: 1.1;
        }
        p {
            margin: 0 0 14px;
            line-height: 1.6;
            color: #47617f;
        }
        code, a {
            color: #002d72;
        }
    </style>
</head>
<body>
    <main>
        <h1><?php echo htmlspecialchars($appTitle, ENT_QUOTES, 'UTF-8'); ?> API</h1>
        <p>This backend now serves API endpoints only. The web UI should be hosted from the frontend project.</p>
        <p>Frontend URL: <a href="<?php echo htmlspecialchars($frontendUrl, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($frontendUrl, ENT_QUOTES, 'UTF-8'); ?></a></p>
        <p>API endpoint: <code>/api.php</code></p>
    </main>
</body>
</html>
