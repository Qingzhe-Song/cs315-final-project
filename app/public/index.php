<?php
declare(strict_types=1);

$appTitle = 'Steam Discovery Dashboard';
$viteDevServer = getenv('VITE_DEV_SERVER_URL');
$useViteDevServer = is_string($viteDevServer) && trim($viteDevServer) !== '';
$viteBaseUrl = $useViteDevServer ? rtrim(trim((string) $viteDevServer), '/') : '';
$assetEntry = 'frontend/app.tsx';

function vite_manifest_entry(string $entry): ?array
{
    $manifestPath = __DIR__ . '/assets/.vite/manifest.json';

    if (!is_file($manifestPath)) {
        return null;
    }

    $manifestJson = file_get_contents($manifestPath);
    if ($manifestJson === false) {
        return null;
    }

    $manifest = json_decode($manifestJson, true);
    if (!is_array($manifest)) {
        return null;
    }

    $entryData = $manifest[$entry] ?? null;
    return is_array($entryData) ? $entryData : null;
}

function vite_asset_href(string $relativePath): string
{
    return './assets/' . ltrim($relativePath, '/');
}

$viteEntry = $useViteDevServer ? null : vite_manifest_entry($assetEntry);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($appTitle, ENT_QUOTES, 'UTF-8'); ?></title>
    <?php if (!$useViteDevServer && is_array($viteEntry)): ?>
        <?php foreach (($viteEntry['css'] ?? []) as $cssFile): ?>
            <link
                rel="stylesheet"
                href="<?php echo htmlspecialchars(vite_asset_href((string) $cssFile), ENT_QUOTES, 'UTF-8'); ?>"
            >
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body>
    <div
        id="app-root"
        data-app-title="<?php echo htmlspecialchars($appTitle, ENT_QUOTES, 'UTF-8'); ?>"
    ></div>

    <noscript>
        <div class="noscript-banner">JavaScript is required to use this interface.</div>
    </noscript>
    <?php if ($useViteDevServer): ?>
        <script type="module" src="<?php echo htmlspecialchars($viteBaseUrl . '/@vite/client', ENT_QUOTES, 'UTF-8'); ?>"></script>
        <script type="module" src="<?php echo htmlspecialchars($viteBaseUrl . '/frontend/app.tsx', ENT_QUOTES, 'UTF-8'); ?>"></script>
    <?php elseif (is_array($viteEntry) && is_string($viteEntry['file'] ?? null)): ?>
        <script
            type="module"
            src="<?php echo htmlspecialchars(vite_asset_href($viteEntry['file']), ENT_QUOTES, 'UTF-8'); ?>"
        ></script>
    <?php else: ?>
        <script type="module" src="./assets/app.js"></script>
    <?php endif; ?>
</body>
</html>
