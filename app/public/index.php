<?php
declare(strict_types=1);

$appTitle = 'Steam Discovery Dashboard';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($appTitle, ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="stylesheet" href="./assets/vendor/tabulator.min.css">
    <link rel="stylesheet" href="./assets/styles.css">
</head>
<body>
    <div class="background-orb orb-one"></div>
    <div class="background-orb orb-two"></div>
    <main class="app-shell">
        <header class="hero">
            <div class="hero-copy">
                <p class="eyebrow">Phase III Draft Interface</p>
                <h1><?php echo htmlspecialchars($appTitle, ENT_QUOTES, 'UTF-8'); ?></h1>
                <p class="hero-text">
                    Explore the 15 analytical SQL questions from the Steam project through a single launch page.
                    Each option runs a PHP-backed MySQL query, renders a results table, and supports charting plus CSV export.
                </p>
            </div>
            <section class="hero-card">
                <h2>How To Use</h2>
                <ol>
                    <li>Select one of the query options from the menu.</li>
                    <li>Adjust the available parameters for the chosen analysis.</li>
                    <li>Run the query to view the table, chart, SQL text, and downloadable result set.</li>
                </ol>
            </section>
        </header>

        <section class="dashboard-grid">
            <aside class="panel menu-panel">
                <div class="panel-header">
                    <h2>Query Menu</h2>
                    <p>15 course-aligned analysis options</p>
                </div>
                <div id="query-list" class="query-list" aria-label="Query menu"></div>
            </aside>

            <section class="panel workspace-panel">
                <div class="panel-header">
                    <div>
                        <p class="section-kicker">Selected Analysis</p>
                        <h2 id="query-title">Loading...</h2>
                    </div>
                    <button id="download-button" class="ghost-button" type="button" disabled>Download CSV</button>
                </div>

                <p id="query-summary" class="query-summary">Loading query catalog...</p>

                <form id="query-form" class="query-form">
                    <div id="query-inputs" class="query-inputs"></div>
                    <div class="form-actions">
                        <button id="run-button" class="primary-button" type="submit">Run Query</button>
                        <span id="status-text" class="status-text" aria-live="polite"></span>
                    </div>
                </form>

                <div class="results-grid">
                    <section class="result-card">
                        <div class="result-card-header">
                            <h3>Visualization</h3>
                            <p id="chart-caption">Charts appear when numeric results are available.</p>
                        </div>
                        <div class="chart-wrap">
                            <canvas id="results-chart" width="960" height="420"></canvas>
                        </div>
                    </section>

                    <section class="result-card">
                        <div class="result-card-header">
                            <h3>Result Table</h3>
                            <p id="table-summary">No query executed yet.</p>
                        </div>
                        <div id="results-table" class="table-wrap"></div>
                    </section>
                </div>

                <section class="result-card sql-card">
                    <div class="result-card-header">
                        <h3>SQL Used</h3>
                        <p>This mirrors the Phase III analytical workload with safe parameterization.</p>
                    </div>
                    <pre id="sql-preview" class="sql-preview">Select a query to inspect its SQL template.</pre>
                </section>
            </section>
        </section>
    </main>

    <noscript>
        <div class="noscript-banner">JavaScript is required to use this interface.</div>
    </noscript>
    <script type="module" src="./assets/app.js"></script>
</body>
</html>
