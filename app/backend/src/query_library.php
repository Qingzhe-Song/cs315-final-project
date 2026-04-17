<?php
declare(strict_types=1);

function int_param(array $input, string $key, int $default): int
{
    if (!isset($input[$key]) || $input[$key] === '') {
        return $default;
    }

    return (int) $input[$key];
}

function float_param(array $input, string $key, float $default): float
{
    if (!isset($input[$key]) || $input[$key] === '') {
        return $default;
    }

    return (float) $input[$key];
}

function string_param(array $input, string $key, string $default): string
{
    if (!isset($input[$key])) {
        return $default;
    }

    return (string) $input[$key];
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
                ['name' => 'min_release_year', 'label' => 'Earliest Release Year', 'type' => 'number', 'default' => 2021],
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Genre', 'type' => 'number', 'default' => 10],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 15],
            ],
            'chart' => ['labelColumns' => ['GenreName'], 'valueColumns' => ['AvgRecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q2',
            'number' => 2,
            'title' => 'High-Performing Publishers',
            'summary' => 'Rank publishers by how many well-reviewed, high-volume games they released.',
            'inputs' => [
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Game', 'type' => 'number', 'default' => 20],
                ['name' => 'min_recommendation_pct', 'label' => 'Minimum Recommendation %', 'type' => 'number', 'default' => 80],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 15],
            ],
            'chart' => ['labelColumns' => ['PublisherName'], 'valueColumns' => ['NumHighPerformingGames'], 'type' => 'bar'],
        ],
        [
            'id' => 'q3',
            'number' => 3,
            'title' => 'Best Genre by Release Year',
            'summary' => 'Show which genre led each release year by average review count per game.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 30],
            ],
            'chart' => ['labelColumns' => ['YearReleased', 'GenreName'], 'valueColumns' => ['AvgReviewsPerGame'], 'type' => 'bar'],
        ],
        [
            'id' => 'q4',
            'number' => 4,
            'title' => 'Popular but Below Average Sentiment',
            'summary' => 'Identify games whose review counts beat their year average while recommendation rates lag behind.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20],
            ],
            'chart' => ['labelColumns' => ['Title'], 'valueColumns' => ['ReviewCount', 'RecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q5',
            'number' => 5,
            'title' => 'Cross-Genre Developer Consistency',
            'summary' => 'Find developers with high recommendation performance across multiple genres.',
            'inputs' => [
                ['name' => 'min_genres', 'label' => 'Minimum Genres', 'type' => 'number', 'default' => 2],
                ['name' => 'min_games', 'label' => 'Minimum Games', 'type' => 'number', 'default' => 2],
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews', 'type' => 'number', 'default' => 20],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20],
            ],
            'chart' => ['labelColumns' => ['DeveloperName'], 'valueColumns' => ['AvgRecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q6',
            'number' => 6,
            'title' => 'Price vs Popularity by Genre',
            'summary' => 'Compare review activity and recommendation rates across price bands within each genre.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 30],
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
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 40],
            ],
            'chart' => ['labelColumns' => ['ReleaseYear', 'GenreName'], 'valueColumns' => ['TotalReviews'], 'type' => 'bar'],
        ],
        [
            'id' => 'q8',
            'number' => 8,
            'title' => 'Multiplayer Engagement Tags',
            'summary' => 'Measure which tags correlate with stronger engagement among multiplayer-supported games.',
            'inputs' => [
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Tag', 'type' => 'number', 'default' => 10],
                ['name' => 'feature_keyword', 'label' => 'Feature Keyword', 'type' => 'text', 'default' => 'multi'],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20],
            ],
            'chart' => ['labelColumns' => ['TagName'], 'valueColumns' => ['AvgHelpfulVotes', 'AvgHoursPlayed'], 'type' => 'bar'],
        ],
        [
            'id' => 'q9',
            'number' => 9,
            'title' => 'Popularity vs Sentiment Mismatch',
            'summary' => 'Rank games whose review volume and recommendation sentiment diverge the most.',
            'inputs' => [
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Game', 'type' => 'number', 'default' => 20],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20],
            ],
            'chart' => ['labelColumns' => ['Title'], 'valueColumns' => ['MismatchScore'], 'type' => 'bar'],
        ],
        [
            'id' => 'q10',
            'number' => 10,
            'title' => 'Popular Publishers by Developer Type',
            'summary' => 'Compare publishers across developer types using popular-game counts and review metrics.',
            'inputs' => [
                ['name' => 'min_reviews', 'label' => 'Minimum Reviews per Game', 'type' => 'number', 'default' => 20],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20],
            ],
            'chart' => ['labelColumns' => ['PublisherName', 'DeveloperType'], 'valueColumns' => ['NumPopularGames'], 'type' => 'bar'],
        ],
        [
            'id' => 'q11',
            'number' => 11,
            'title' => 'Multi-Platform Review Activity',
            'summary' => 'Show how review activity changes for games that support two or more operating systems.',
            'inputs' => [
                ['name' => 'min_platforms', 'label' => 'Minimum Supported Platforms', 'type' => 'number', 'default' => 2],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20],
            ],
            'chart' => ['labelColumns' => ['Title'], 'valueColumns' => ['ReviewCount', 'RecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q12',
            'number' => 12,
            'title' => 'Traits of Top-Reviewed Games',
            'summary' => 'Profile the genre, developer type, and price range patterns of the most reviewed games.',
            'inputs' => [
                ['name' => 'top_limit', 'label' => 'How Many Top-Reviewed Games', 'type' => 'number', 'default' => 50],
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 25],
            ],
            'chart' => ['labelColumns' => ['GenreName', 'PriceRange'], 'valueColumns' => ['NumTopGames'], 'type' => 'bar'],
        ],
        [
            'id' => 'q13',
            'number' => 13,
            'title' => 'Best Release Months',
            'summary' => 'Compare release months by average reviews per game and recommendation rate.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 12],
            ],
            'chart' => ['labelColumns' => ['ReleaseMonth'], 'valueColumns' => ['AvgReviewsPerGame', 'AvgRecommendationPct'], 'type' => 'bar'],
        ],
        [
            'id' => 'q14',
            'number' => 14,
            'title' => 'Largest Review-Count Gaps',
            'summary' => 'Compare same-year, same-genre games with the biggest review-count gaps.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 50],
            ],
            'chart' => ['labelColumns' => ['ReleaseYear', 'GenreName'], 'valueColumns' => ['ReviewCountGap'], 'type' => 'bar'],
        ],
        [
            'id' => 'q15',
            'number' => 15,
            'title' => 'Developer Improvement Over Time',
            'summary' => 'Measure how recommendation rate and review count change from a developer’s early to late releases.',
            'inputs' => [
                ['name' => 'limit', 'label' => 'Rows to Show', 'type' => 'number', 'default' => 20],
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

function build_procedure_plan(string $procedureName, string $types, array $params): array
{
    $placeholders = [];

    foreach ($params as $_) {
        $placeholders[] = '?';
    }

    return [
        'sql' => sprintf('CALL %s(%s)', $procedureName, implode(', ', $placeholders)),
        'types' => $types,
        'params' => $params,
    ];
}

function build_query_plan(string $queryId, array $input): array
{
    switch ($queryId) {
        case 'q1':
            $minReleaseYear = int_param($input, 'min_release_year', 2021);
            $minReviews = int_param($input, 'min_reviews', 10);
            $limit = int_param($input, 'limit', 15);

            return build_procedure_plan('sp_query_q1', 'iii', [$minReleaseYear, $minReviews, $limit]);

        case 'q2':
            $minReviews = int_param($input, 'min_reviews', 20);
            $minRecommendationPct = float_param($input, 'min_recommendation_pct', 80.0);
            $limit = int_param($input, 'limit', 15);

            return build_procedure_plan('sp_query_q2', 'idi', [$minReviews, $minRecommendationPct, $limit]);

        case 'q3':
            $limit = int_param($input, 'limit', 30);

            return build_procedure_plan('sp_query_q3', 'i', [$limit]);

        case 'q4':
            $limit = int_param($input, 'limit', 20);

            return build_procedure_plan('sp_query_q4', 'i', [$limit]);

        case 'q5':
            $minGenres = int_param($input, 'min_genres', 2);
            $minGames = int_param($input, 'min_games', 2);
            $minReviews = int_param($input, 'min_reviews', 20);
            $limit = int_param($input, 'limit', 20);

            return build_procedure_plan('sp_query_q5', 'iiii', [$minGenres, $minGames, $minReviews, $limit]);

        case 'q6':
            $limit = int_param($input, 'limit', 30);

            return build_procedure_plan('sp_query_q6', 'i', [$limit]);

        case 'q7':
            $genreKeyword = string_param($input, 'genre_keyword', '');
            $limit = int_param($input, 'limit', 40);

            return build_procedure_plan('sp_query_q7', 'si', [$genreKeyword, $limit]);

        case 'q8':
            $minReviews = int_param($input, 'min_reviews', 10);
            $featureKeyword = string_param($input, 'feature_keyword', 'multi');
            $limit = int_param($input, 'limit', 20);

            return build_procedure_plan('sp_query_q8', 'sii', [$featureKeyword, $minReviews, $limit]);

        case 'q9':
            $minReviews = int_param($input, 'min_reviews', 20);
            $limit = int_param($input, 'limit', 20);

            return build_procedure_plan('sp_query_q9', 'ii', [$minReviews, $limit]);

        case 'q10':
            $minReviews = int_param($input, 'min_reviews', 20);
            $limit = int_param($input, 'limit', 20);

            return build_procedure_plan('sp_query_q10', 'ii', [$minReviews, $limit]);

        case 'q11':
            $minPlatforms = int_param($input, 'min_platforms', 2);
            $limit = int_param($input, 'limit', 20);

            return build_procedure_plan('sp_query_q11', 'ii', [$minPlatforms, $limit]);

        case 'q12':
            $topLimit = int_param($input, 'top_limit', 50);
            $limit = int_param($input, 'limit', 25);

            return build_procedure_plan('sp_query_q12', 'ii', [$topLimit, $limit]);

        case 'q13':
            $limit = int_param($input, 'limit', 12);

            return build_procedure_plan('sp_query_q13', 'i', [$limit]);

        case 'q14':
            $limit = int_param($input, 'limit', 50);

            return build_procedure_plan('sp_query_q14', 'i', [$limit]);

        case 'q15':
            $limit = int_param($input, 'limit', 20);

            return build_procedure_plan('sp_query_q15', 'i', [$limit]);
    }

    throw new InvalidArgumentException('Unknown query.');
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

function flush_pending_results(mysqli $connection): void
{
    while ($connection->more_results()) {
        $connection->next_result();
        $result = $connection->store_result();

        if ($result instanceof mysqli_result) {
            $result->free();
        }
    }
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
    flush_pending_results($connection);

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
