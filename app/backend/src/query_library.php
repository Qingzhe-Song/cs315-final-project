<?php
declare(strict_types=1);

function int_param(array $input, string $key, int $default, int $min, int $max): int
{
    $value = $input[$key] ?? $default;

    if (is_string($value)) {
        $value = trim($value);
    }

    if ($value === '' || $value === null || !is_numeric((string) $value)) {
        return $default;
    }

    $parsed = (int) round((float) $value);

    return max($min, min($max, $parsed));
}

function float_param(array $input, string $key, float $default, float $min, float $max): float
{
    $value = $input[$key] ?? $default;

    if (is_string($value)) {
        $value = trim($value);
    }

    if ($value === '' || $value === null || !is_numeric((string) $value)) {
        return $default;
    }

    $parsed = (float) $value;

    return max($min, min($max, $parsed));
}

function string_param(array $input, string $key, string $default, int $maxLength): string
{
    $value = $input[$key] ?? $default;

    if (!is_string($value)) {
        return $default;
    }

    $trimmed = trim($value);

    if ($trimmed === '') {
        return $default;
    }

    if (function_exists('mb_substr')) {
        return mb_substr($trimmed, 0, $maxLength);
    }

    return substr($trimmed, 0, $maxLength);
}

function get_query_catalog(): array
{
    return [
        [
            'id' => 'q1',
            'number' => 1,
            'title' => 'Top Genres After 2020',
            'summary' => 'Find genres with the strongest recommendation rates for recently released games.',
            'inputs' => [
                ['name' => 'min_release_year', 'label' => 'Earliest Release Year', 'type' => 'number', 'default' => 2021, 'min' => 1990, 'max' => 2035],
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Genre', 'type' => 'number', 'default' => 10, 'min' => 1, 'max' => 1000000],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 15, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['GenreName'], 'valueColumns' => ['AvgRecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q2',
            'number' => 2,
            'title' => 'High-Performing Publishers',
            'summary' => 'Rank publishers by how many well-reviewed, high-volume games they released.',
            'inputs' => [
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Game', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 1000000],
                ['name' => 'min_recommendation_pct', 'label' => 'Minimum Recommendation %', 'type' => 'number', 'default' => 80, 'min' => 1, 'max' => 100],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 15, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['PublisherName'], 'valueColumns' => ['NumHighPerformingGames'], 'type' => 'bar'],
        ],
        [
            'id' => 'q3',
            'number' => 3,
            'title' => 'Best Genre by Release Year',
            'summary' => 'Show which genre led each release year by average review count per game.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 30, 'min' => 1, 'max' => 200],
            ],
            'chart' => ['labelColumns' => ['YearReleased', 'GenreName'], 'valueColumns' => ['AvgReviewsPerGame'], 'type' => 'bar'],
        ],
        [
            'id' => 'q4',
            'number' => 4,
            'title' => 'Popular but Below Average Sentiment',
            'summary' => 'Identify games whose review counts beat their year average while recommendation rates lag behind.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['Title'], 'valueColumns' => ['ReviewCount', 'RecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q5',
            'number' => 5,
            'title' => 'Cross-Genre Developer Consistency',
            'summary' => 'Find developers with high recommendation performance across multiple genres.',
            'inputs' => [
                ['name' => 'min_genres', 'label' => 'Minimum Genres', 'type' => 'number', 'default' => 2, 'min' => 1, 'max' => 20],
                ['name' => 'min_games', 'label' => 'Minimum Games', 'type' => 'number', 'default' => 2, 'min' => 1, 'max' => 1000],
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 1000000],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['DeveloperName'], 'valueColumns' => ['AvgRecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q6',
            'number' => 6,
            'title' => 'Price vs Popularity by Genre',
            'summary' => 'Compare review activity and recommendation rates across price bands within each genre.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 30, 'min' => 1, 'max' => 200],
            ],
            'chart' => ['labelColumns' => ['GenreName', 'PriceRange'], 'valueColumns' => ['AvgReviewsPerGame'], 'type' => 'bar'],
        ],
        [
            'id' => 'q7',
            'number' => 7,
            'title' => 'Genre Growth Over Time',
            'summary' => 'Track genre growth in both released games and review activity over time.',
            'inputs' => [
                ['name' => 'genre_keyword', 'label' => 'Optional Genre Keyword', 'type' => 'text', 'default' => ''],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 40, 'min' => 1, 'max' => 250],
            ],
            'chart' => ['labelColumns' => ['ReleaseYear', 'GenreName'], 'valueColumns' => ['TotalReviews'], 'type' => 'bar'],
        ],
        [
            'id' => 'q8',
            'number' => 8,
            'title' => 'Multiplayer Engagement Tags',
            'summary' => 'Measure which tags correlate with stronger engagement among multiplayer-supported games.',
            'inputs' => [
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Tag', 'type' => 'number', 'default' => 10, 'min' => 1, 'max' => 1000000],
                ['name' => 'feature_keyword', 'label' => 'Feature Keyword', 'type' => 'text', 'default' => 'multi'],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['TagName'], 'valueColumns' => ['AvgHelpfulVotes', 'AvgHoursPlayed'], 'type' => 'bar'],
        ],
        [
            'id' => 'q9',
            'number' => 9,
            'title' => 'Popularity vs Sentiment Mismatch',
            'summary' => 'Rank games whose review volume and recommendation sentiment diverge the most.',
            'inputs' => [
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Game', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 1000000],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['Title'], 'valueColumns' => ['MismatchScore'], 'type' => 'bar'],
        ],
        [
            'id' => 'q10',
            'number' => 10,
            'title' => 'Popular Publishers by Developer Type',
            'summary' => 'Compare publishers across developer types using popular-game counts and review metrics.',
            'inputs' => [
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Game', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 1000000],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['PublisherName', 'DeveloperType'], 'valueColumns' => ['NumPopularGames'], 'type' => 'bar'],
        ],
        [
            'id' => 'q11',
            'number' => 11,
            'title' => 'Multi-Platform Review Activity',
            'summary' => 'Show how review activity changes for games that support two or more operating systems.',
            'inputs' => [
                ['name' => 'min_platforms', 'label' => 'Minimum Supported Platforms', 'type' => 'number', 'default' => 2, 'min' => 2, 'max' => 10],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['Title'], 'valueColumns' => ['ReviewCount', 'RecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q12',
            'number' => 12,
            'title' => 'Traits of Top-Reviewed Games',
            'summary' => 'Profile the genre, developer type, and price range patterns of the most reviewed games.',
            'inputs' => [
                ['name' => 'top_limit', 'label' => 'How Many Top-Reviewed Games', 'type' => 'number', 'default' => 50, 'min' => 5, 'max' => 500],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 25, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['GenreName', 'PriceRange'], 'valueColumns' => ['NumTopGames'], 'type' => 'bar'],
        ],
        [
            'id' => 'q13',
            'number' => 13,
            'title' => 'Best Release Months',
            'summary' => 'Compare release months by average reviews per game and recommendation rate.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 12, 'min' => 1, 'max' => 12],
            ],
            'chart' => ['labelColumns' => ['ReleaseMonth'], 'valueColumns' => ['AvgReviewsPerGame', 'AvgRecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q14',
            'number' => 14,
            'title' => 'Largest Review-Count Gaps',
            'summary' => 'Compare same-year, same-genre games with the biggest review-count gaps.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 50, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['ReleaseYear', 'GenreName'], 'valueColumns' => ['ReviewCountGap'], 'type' => 'bar'],
        ],
        [
            'id' => 'q15',
            'number' => 15,
            'title' => 'Developer Improvement Over Time',
            'summary' => 'Measure how recommendation rate and review count change from a developer’s early to late releases.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20, 'min' => 1, 'max' => 100],
            ],
            'chart' => ['labelColumns' => ['DeveloperName'], 'valueColumns' => ['RecommendationImprovement', 'ReviewCountImprovement'], 'type' => 'bar'],
        ],
    ];
}

function find_query_definition(string $queryId): ?array
{
    foreach (get_query_catalog() as $definition) {
        if ($definition['id'] === $queryId) {
            return $definition;
        }
    }

    return null;
}

function build_query_plan(string $queryId, array $input): array
{
    switch ($queryId) {
        case 'q1':
            $minReleaseYear = int_param($input, 'min_release_year', 2021, 1990, 2035);
            $minReviews = int_param($input, 'min_reviews', 10, 1, 1000000);
            $limit = int_param($input, 'limit', 15, 1, 100);

            return [
                'sql' => "SELECT
    ca.GenreName,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
    ROUND(
        AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
        2
    ) AS AvgRecommendationPct
FROM Game g
JOIN ClassifiedAs ca ON g.GameID = ca.GameID
JOIN Review r ON g.GameID = r.GameID
WHERE g.ReleaseDate >= ?
GROUP BY ca.GenreName
HAVING COUNT(r.ReviewID) >= ?
ORDER BY AvgRecommendationPct DESC, NumReviews DESC
LIMIT {$limit}",
                'types' => 'si',
                'params' => [sprintf('%04d-01-01', $minReleaseYear), $minReviews],
            ];

        case 'q2':
            $minReviews = int_param($input, 'min_reviews', 20, 1, 1000000);
            $minRecommendationPct = float_param($input, 'min_recommendation_pct', 80.0, 1.0, 100.0);
            $limit = int_param($input, 'limit', 15, 1, 100);

            return [
                'sql' => "SELECT
    pb.PublisherName,
    COUNT(*) AS NumHighPerformingGames
FROM (
    SELECT
        g.GameID
    FROM Game g
    JOIN Review r ON g.GameID = r.GameID
    GROUP BY g.GameID
    HAVING COUNT(r.ReviewID) >= ?
       AND AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) >= ?
) AS high_perf
JOIN PublishedBy pb ON high_perf.GameID = pb.GameID
GROUP BY pb.PublisherName
ORDER BY NumHighPerformingGames DESC, pb.PublisherName
LIMIT {$limit}",
                'types' => 'id',
                'params' => [$minReviews, $minRecommendationPct / 100],
            ];

        case 'q3':
            $limit = int_param($input, 'limit', 30, 1, 200);

            return [
                'sql' => "SELECT
    yearly.YearReleased,
    yearly.GenreName,
    yearly.AvgReviewsPerGame
FROM (
    SELECT
        YEAR(g.ReleaseDate) AS YearReleased,
        ca.GenreName,
        ROUND(AVG(gr.ReviewCount), 2) AS AvgReviewsPerGame
    FROM Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount
        FROM Review
        GROUP BY GameID
    ) AS gr ON g.GameID = gr.GameID
    GROUP BY YEAR(g.ReleaseDate), ca.GenreName
) AS yearly
JOIN (
    SELECT
        x.YearReleased,
        MAX(x.AvgReviewsPerGame) AS MaxAvgReviewsPerGame
    FROM (
        SELECT
            YEAR(g.ReleaseDate) AS YearReleased,
            ca.GenreName,
            AVG(gr.ReviewCount) AS AvgReviewsPerGame
        FROM Game g
        JOIN ClassifiedAs ca ON g.GameID = ca.GameID
        JOIN (
            SELECT
                GameID,
                COUNT(*) AS ReviewCount
            FROM Review
            GROUP BY GameID
        ) AS gr ON g.GameID = gr.GameID
        GROUP BY YEAR(g.ReleaseDate), ca.GenreName
    ) AS x
    GROUP BY x.YearReleased
) AS best
    ON yearly.YearReleased = best.YearReleased
   AND yearly.AvgReviewsPerGame = best.MaxAvgReviewsPerGame
ORDER BY yearly.YearReleased
LIMIT {$limit}",
                'types' => '',
                'params' => [],
            ];

        case 'q4':
            $limit = int_param($input, 'limit', 20, 1, 100);

            return [
                'sql' => "SELECT
    pg.Title,
    YEAR(pg.ReleaseDate) AS ReleaseYear,
    pg.ReviewCount,
    ROUND(pg.RecommendationPct, 2) AS RecommendationPct,
    ROUND(ya.AvgYearReviewCount, 2) AS AvgYearReviewCount,
    ROUND(ya.AvgYearRecommendationPct, 2) AS AvgYearRecommendationPct
FROM (
    SELECT
        g.GameID,
        g.Title,
        g.ReleaseDate,
        COUNT(r.ReviewID) AS ReviewCount,
        AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100 AS RecommendationPct
    FROM Game g
    JOIN Review r ON g.GameID = r.GameID
    GROUP BY g.GameID, g.Title, g.ReleaseDate
) AS pg
JOIN (
    SELECT
        t.ReleaseYear,
        AVG(t.ReviewCount) AS AvgYearReviewCount,
        AVG(t.RecommendationPct) AS AvgYearRecommendationPct
    FROM (
        SELECT
            YEAR(g.ReleaseDate) AS ReleaseYear,
            g.GameID,
            COUNT(r.ReviewID) AS ReviewCount,
            AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100 AS RecommendationPct
        FROM Game g
        JOIN Review r ON g.GameID = r.GameID
        GROUP BY YEAR(g.ReleaseDate), g.GameID
    ) AS t
    GROUP BY t.ReleaseYear
) AS ya ON YEAR(pg.ReleaseDate) = ya.ReleaseYear
WHERE pg.ReviewCount > ya.AvgYearReviewCount
  AND pg.RecommendationPct < ya.AvgYearRecommendationPct
ORDER BY pg.ReviewCount DESC, pg.RecommendationPct ASC
LIMIT {$limit}",
                'types' => '',
                'params' => [],
            ];

        case 'q5':
            $minGenres = int_param($input, 'min_genres', 2, 1, 20);
            $minGames = int_param($input, 'min_games', 2, 1, 1000);
            $minReviews = int_param($input, 'min_reviews', 20, 1, 1000000);
            $limit = int_param($input, 'limit', 20, 1, 100);

            return [
                'sql' => "SELECT
    d.DeveloperName,
    d.DeveloperType,
    COUNT(DISTINCT ca.GenreName) AS NumGenres,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
    ROUND(
        AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
        2
    ) AS AvgRecommendationPct
FROM Developer d
JOIN DevelopedBy db ON d.DeveloperName = db.DeveloperName
JOIN Game g ON db.GameID = g.GameID
JOIN ClassifiedAs ca ON g.GameID = ca.GameID
JOIN Review r ON g.GameID = r.GameID
GROUP BY d.DeveloperName, d.DeveloperType
HAVING COUNT(DISTINCT ca.GenreName) >= ?
   AND COUNT(DISTINCT g.GameID) >= ?
   AND COUNT(r.ReviewID) >= ?
ORDER BY AvgRecommendationPct DESC, NumGenres DESC, NumGames DESC
LIMIT {$limit}",
                'types' => 'iii',
                'params' => [$minGenres, $minGames, $minReviews],
            ];

        case 'q6':
            $limit = int_param($input, 'limit', 30, 1, 200);

            return [
                'sql' => "SELECT
    ca.GenreName,
    CASE
        WHEN g.Price = 0 THEN 'Free'
        WHEN g.Price < 10 THEN 'Under \$10'
        WHEN g.Price < 30 THEN '\$10-\$29.99'
        WHEN g.Price < 60 THEN '\$30-\$59.99'
        ELSE '\$60+'
    END AS PriceRange,
    COUNT(DISTINCT g.GameID) AS NumGames,
    ROUND(AVG(gr.ReviewCount), 2) AS AvgReviewsPerGame,
    ROUND(
        AVG(
            CASE WHEN gr.ReviewCount > 0 THEN gr.RecommendationPct END
        ),
        2
    ) AS AvgRecommendationPct
FROM Game g
JOIN ClassifiedAs ca ON g.GameID = ca.GameID
JOIN (
    SELECT
        GameID,
        COUNT(*) AS ReviewCount,
        AVG(CASE WHEN IsRecommended THEN 1 ELSE 0 END) * 100 AS RecommendationPct
    FROM Review
    GROUP BY GameID
) AS gr ON g.GameID = gr.GameID
GROUP BY
    ca.GenreName,
    CASE
        WHEN g.Price = 0 THEN 'Free'
        WHEN g.Price < 10 THEN 'Under \$10'
        WHEN g.Price < 30 THEN '\$10-\$29.99'
        WHEN g.Price < 60 THEN '\$30-\$59.99'
        ELSE '\$60+'
    END
ORDER BY ca.GenreName, AvgReviewsPerGame DESC
LIMIT {$limit}",
                'types' => '',
                'params' => [],
            ];

        case 'q7':
            $genreKeyword = string_param($input, 'genre_keyword', '', 50);
            $limit = int_param($input, 'limit', 40, 1, 250);

            return [
                'sql' => "SELECT
    YEAR(g.ReleaseDate) AS ReleaseYear,
    ca.GenreName,
    COUNT(DISTINCT g.GameID) AS NumReleasedGames,
    COUNT(r.ReviewID) AS TotalReviews,
    ROUND(
        AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
        2
    ) AS AvgRecommendationPct
FROM Game g
JOIN ClassifiedAs ca ON g.GameID = ca.GameID
LEFT JOIN Review r ON g.GameID = r.GameID
WHERE (? = '' OR ca.GenreName LIKE CONCAT('%', ?, '%'))
GROUP BY YEAR(g.ReleaseDate), ca.GenreName
ORDER BY ca.GenreName, ReleaseYear
LIMIT {$limit}",
                'types' => 'ss',
                'params' => [$genreKeyword, $genreKeyword],
            ];

        case 'q8':
            $minReviews = int_param($input, 'min_reviews', 10, 1, 1000000);
            $featureKeyword = string_param($input, 'feature_keyword', 'multi', 50);
            $limit = int_param($input, 'limit', 20, 1, 100);

            return [
                'sql' => "SELECT
    tw.TagName,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
    ROUND(AVG(r.HelpfulVotes), 2) AS AvgHelpfulVotes,
    ROUND(AVG(r.HoursPlayed), 2) AS AvgHoursPlayed,
    ROUND(
        AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
        2
    ) AS AvgRecommendationPct
FROM Game g
JOIN HasFeatures hf ON g.GameID = hf.GameID
JOIN TaggedWith tw ON g.GameID = tw.GameID
JOIN Review r ON g.GameID = r.GameID
WHERE LOWER(hf.FeatureName) LIKE CONCAT('%', LOWER(?), '%')
GROUP BY tw.TagName
HAVING COUNT(r.ReviewID) >= ?
ORDER BY AvgHelpfulVotes DESC, AvgHoursPlayed DESC, NumReviews DESC
LIMIT {$limit}",
                'types' => 'si',
                'params' => [$featureKeyword, $minReviews],
            ];

        case 'q9':
            $minReviews = int_param($input, 'min_reviews', 20, 1, 1000000);
            $limit = int_param($input, 'limit', 20, 1, 100);

            return [
                'sql' => "SELECT
    g.Title,
    COUNT(r.ReviewID) AS ReviewCount,
    ROUND(
        AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
        2
    ) AS RecommendationPct,
    ROUND(
        COUNT(r.ReviewID) * (
            1 - AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END)
        ),
        2
    ) AS MismatchScore
FROM Game g
JOIN Review r ON g.GameID = r.GameID
GROUP BY g.GameID, g.Title
HAVING COUNT(r.ReviewID) >= ?
ORDER BY MismatchScore DESC, ReviewCount DESC
LIMIT {$limit}",
                'types' => 'i',
                'params' => [$minReviews],
            ];

        case 'q10':
            $minReviews = int_param($input, 'min_reviews', 20, 1, 1000000);
            $limit = int_param($input, 'limit', 20, 1, 100);

            return [
                'sql' => "SELECT
    pb.PublisherName,
    d.DeveloperType,
    COUNT(DISTINCT g.GameID) AS NumPopularGames,
    ROUND(AVG(gr.ReviewCount), 2) AS AvgReviewsPerGame,
    ROUND(AVG(gr.RecommendationPct), 2) AS AvgRecommendationPct
FROM Game g
JOIN PublishedBy pb ON g.GameID = pb.GameID
JOIN DevelopedBy db ON g.GameID = db.GameID
JOIN Developer d ON db.DeveloperName = d.DeveloperName
JOIN (
    SELECT
        GameID,
        COUNT(*) AS ReviewCount,
        AVG(CASE WHEN IsRecommended THEN 1 ELSE 0 END) * 100 AS RecommendationPct
    FROM Review
    GROUP BY GameID
) AS gr ON g.GameID = gr.GameID
WHERE gr.ReviewCount >= ?
GROUP BY pb.PublisherName, d.DeveloperType
ORDER BY NumPopularGames DESC, AvgRecommendationPct DESC
LIMIT {$limit}",
                'types' => 'i',
                'params' => [$minReviews],
            ];

        case 'q11':
            $minPlatforms = int_param($input, 'min_platforms', 2, 2, 10);
            $limit = int_param($input, 'limit', 20, 1, 100);

            return [
                'sql' => "SELECT
    g.Title,
    COUNT(DISTINCT s.PlatformName) AS NumPlatforms,
    GROUP_CONCAT(
        DISTINCT s.PlatformName
        ORDER BY s.PlatformName SEPARATOR ', '
    ) AS Platforms,
    COUNT(r.ReviewID) AS ReviewCount,
    ROUND(
        AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
        2
    ) AS RecommendationPct
FROM Game g
JOIN Supports s ON g.GameID = s.GameID
LEFT JOIN Review r ON g.GameID = r.GameID
GROUP BY g.GameID, g.Title
HAVING COUNT(DISTINCT s.PlatformName) >= ?
ORDER BY NumPlatforms DESC, ReviewCount DESC, RecommendationPct DESC
LIMIT {$limit}",
                'types' => 'i',
                'params' => [$minPlatforms],
            ];

        case 'q12':
            $topLimit = int_param($input, 'top_limit', 50, 5, 500);
            $limit = int_param($input, 'limit', 25, 1, 100);

            return [
                'sql' => "SELECT
    ca.GenreName,
    d.DeveloperType,
    CASE
        WHEN g.Price = 0 THEN 'Free'
        WHEN g.Price < 10 THEN 'Under \$10'
        WHEN g.Price < 30 THEN '\$10-\$29.99'
        WHEN g.Price < 60 THEN '\$30-\$59.99'
        ELSE '\$60+'
    END AS PriceRange,
    COUNT(DISTINCT g.GameID) AS NumTopGames,
    ROUND(AVG(gr.ReviewCount), 2) AS AvgReviews,
    ROUND(AVG(gr.RecommendationPct), 2) AS AvgRecommendationPct
FROM Game g
JOIN ClassifiedAs ca ON g.GameID = ca.GameID
JOIN DevelopedBy db ON g.GameID = db.GameID
JOIN Developer d ON db.DeveloperName = d.DeveloperName
JOIN (
    SELECT
        GameID,
        COUNT(*) AS ReviewCount,
        AVG(CASE WHEN IsRecommended THEN 1 ELSE 0 END) * 100 AS RecommendationPct
    FROM Review
    GROUP BY GameID
) AS gr ON g.GameID = gr.GameID
WHERE g.GameID IN (
    SELECT
        t.GameID
    FROM (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount
        FROM Review
        GROUP BY GameID
        ORDER BY ReviewCount DESC
        LIMIT {$topLimit}
    ) AS t
)
GROUP BY
    ca.GenreName,
    d.DeveloperType,
    CASE
        WHEN g.Price = 0 THEN 'Free'
        WHEN g.Price < 10 THEN 'Under \$10'
        WHEN g.Price < 30 THEN '\$10-\$29.99'
        WHEN g.Price < 60 THEN '\$30-\$59.99'
        ELSE '\$60+'
    END
ORDER BY NumTopGames DESC, AvgRecommendationPct DESC
LIMIT {$limit}",
                'types' => '',
                'params' => [],
            ];

        case 'q13':
            $limit = int_param($input, 'limit', 12, 1, 12);

            return [
                'sql' => "SELECT
    MONTH(g.ReleaseDate) AS ReleaseMonth,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
    ROUND(COUNT(r.ReviewID) / COUNT(DISTINCT g.GameID), 2) AS AvgReviewsPerGame,
    ROUND(
        AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
        2
    ) AS AvgRecommendationPct
FROM Game g
JOIN Review r ON g.GameID = r.GameID
GROUP BY MONTH(g.ReleaseDate)
ORDER BY AvgReviewsPerGame DESC, AvgRecommendationPct DESC
LIMIT {$limit}",
                'types' => '',
                'params' => [],
            ];

        case 'q14':
            $limit = int_param($input, 'limit', 50, 1, 100);

            return [
                'sql' => "SELECT
    a.ReleaseYear,
    a.GenreName,
    a.Title AS MoreReviewedGame,
    b.Title AS LessReviewedGame,
    a.ReviewCount AS MoreReviewedCount,
    b.ReviewCount AS LessReviewedCount,
    (a.ReviewCount - b.ReviewCount) AS ReviewCountGap
FROM (
    SELECT
        g.GameID,
        g.Title,
        YEAR(g.ReleaseDate) AS ReleaseYear,
        ca.GenreName,
        COUNT(r.ReviewID) AS ReviewCount
    FROM Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN Review r ON g.GameID = r.GameID
    GROUP BY g.GameID, g.Title, YEAR(g.ReleaseDate), ca.GenreName
) AS a
JOIN (
    SELECT
        g.GameID,
        g.Title,
        YEAR(g.ReleaseDate) AS ReleaseYear,
        ca.GenreName,
        COUNT(r.ReviewID) AS ReviewCount
    FROM Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN Review r ON g.GameID = r.GameID
    GROUP BY g.GameID, g.Title, YEAR(g.ReleaseDate), ca.GenreName
) AS b
    ON a.ReleaseYear = b.ReleaseYear
   AND a.GenreName = b.GenreName
   AND a.GameID < b.GameID
WHERE a.ReviewCount > b.ReviewCount
ORDER BY ReviewCountGap DESC, a.ReleaseYear, a.GenreName
LIMIT {$limit}",
                'types' => '',
                'params' => [],
            ];

        case 'q15':
            $limit = int_param($input, 'limit', 20, 1, 100);

            return [
                'sql' => "SELECT
    d.DeveloperName,
    d.DeveloperType,
    ROUND(
        AVG(CASE WHEN g.ReleaseDate = dev_bounds.FirstReleaseDate THEN stats.RecommendationPct END),
        2
    ) AS FirstRecommendationPct,
    ROUND(
        AVG(CASE WHEN g.ReleaseDate = dev_bounds.LastReleaseDate THEN stats.RecommendationPct END),
        2
    ) AS LastRecommendationPct,
    ROUND(
        AVG(CASE WHEN g.ReleaseDate = dev_bounds.LastReleaseDate THEN stats.RecommendationPct END)
        - AVG(CASE WHEN g.ReleaseDate = dev_bounds.FirstReleaseDate THEN stats.RecommendationPct END),
        2
    ) AS RecommendationImprovement,
    ROUND(
        AVG(CASE WHEN g.ReleaseDate = dev_bounds.FirstReleaseDate THEN stats.ReviewCount END),
        2
    ) AS FirstReviewCount,
    ROUND(
        AVG(CASE WHEN g.ReleaseDate = dev_bounds.LastReleaseDate THEN stats.ReviewCount END),
        2
    ) AS LastReviewCount,
    ROUND(
        AVG(CASE WHEN g.ReleaseDate = dev_bounds.LastReleaseDate THEN stats.ReviewCount END)
        - AVG(CASE WHEN g.ReleaseDate = dev_bounds.FirstReleaseDate THEN stats.ReviewCount END),
        2
    ) AS ReviewCountImprovement
FROM Developer d
JOIN DevelopedBy db ON d.DeveloperName = db.DeveloperName
JOIN Game g ON db.GameID = g.GameID
JOIN (
    SELECT
        db2.DeveloperName,
        MIN(g2.ReleaseDate) AS FirstReleaseDate,
        MAX(g2.ReleaseDate) AS LastReleaseDate
    FROM DevelopedBy db2
    JOIN Game g2 ON db2.GameID = g2.GameID
    GROUP BY db2.DeveloperName
    HAVING MIN(g2.ReleaseDate) < MAX(g2.ReleaseDate)
) AS dev_bounds ON d.DeveloperName = dev_bounds.DeveloperName
JOIN (
    SELECT
        g3.GameID,
        COUNT(r3.ReviewID) AS ReviewCount,
        AVG(CASE WHEN r3.IsRecommended THEN 1 ELSE 0 END) * 100 AS RecommendationPct
    FROM Game g3
    JOIN Review r3 ON g3.GameID = r3.GameID
    GROUP BY g3.GameID
) AS stats ON g.GameID = stats.GameID
GROUP BY d.DeveloperName, d.DeveloperType
ORDER BY RecommendationImprovement DESC, ReviewCountImprovement DESC
LIMIT {$limit}",
                'types' => '',
                'params' => [],
            ];
    }

    throw new InvalidArgumentException('Unknown query id.');
}

function bind_query_params(mysqli_stmt $statement, string $types, array $params): void
{
    if ($types === '') {
        return;
    }

    $bindValues = [];
    $bindValues[] = &$types;

    foreach ($params as $index => $value) {
        $bindValues[] = &$params[$index];
    }

    call_user_func_array([$statement, 'bind_param'], $bindValues);
}

function execute_query(mysqli $connection, string $queryId, array $input): array
{
    $definition = find_query_definition($queryId);

    if ($definition === null) {
        throw new InvalidArgumentException('Unsupported query id.');
    }

    $plan = build_query_plan($queryId, $input);
    $startedAt = microtime(true);
    $statement = $connection->prepare($plan['sql']);

    bind_query_params($statement, $plan['types'], $plan['params']);

    $statement->execute();
    $rows = [];
    $columns = [];

    $metadata = $statement->result_metadata();

    if ($metadata !== false) {
        $fields = $metadata->fetch_fields();
        $boundRow = [];
        $boundValues = [];

        foreach ($fields as $field) {
            $columns[] = $field->name;
            $boundRow[$field->name] = null;
            $boundValues[] = &$boundRow[$field->name];
        }

        call_user_func_array([$statement, 'bind_result'], $boundValues);

        while ($statement->fetch()) {
            $row = [];
            foreach ($columns as $column) {
                $row[$column] = $boundRow[$column];
            }
            $rows[] = $row;
        }

        $metadata->free();
    }

    $statement->close();

    return [
        'query' => [
            'id' => $definition['id'],
            'number' => $definition['number'],
            'title' => $definition['title'],
            'summary' => $definition['summary'],
        ],
        'columns' => $columns,
        'rows' => $rows,
        'rowCount' => count($rows),
        'chart' => $definition['chart'],
        'sql' => $plan['sql'],
        'params' => $plan['params'],
        'durationMs' => round((microtime(true) - $startedAt) * 1000, 2),
    ];
}
