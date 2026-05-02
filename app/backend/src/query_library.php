<?php

// reads integer inputs while falling back when a field is absent or blank.
function read_int_param($input, $key, $default)
{
    if (!isset($input[$key]) || $input[$key] === '') {
        return $default;
    }

    return (int) $input[$key];
}

// reads decimal inputs while falling back when a field is absent or blank.
function read_float_param($input, $key, $default)
{
    if (!isset($input[$key]) || $input[$key] === '') {
        return $default;
    }

    return (float) $input[$key];
}

// reads text inputs while preserving an explicit empty string.
function read_string_param($input, $key, $default)
{
    if (!isset($input[$key])) {
        return $default;
    }

    return (string) $input[$key];
}

// builds a stored procedure call with placeholders for prepared statements.
function build_call_sql($procedureName, $params)
{
    if (count($params) === 0) {
        return 'CALL ' . $procedureName . '()';
    }

    $placeholders = array_fill(0, count($params), '?');
    return 'CALL ' . $procedureName . '(' . implode(', ', $placeholders) . ')';
}

// builds the mysqli bind_param type string for prepared statement values.
function build_param_type_string($params)
{
    $types = '';

    foreach ($params as $param) {
        if (is_int($param)) {
            $types .= 'i';
        } elseif (is_float($param)) {
            $types .= 'd';
        } else {
            $types .= 's';
        }
    }

    return $types;
}

// maps a preset query id to its stored procedure and parameter list.
function build_query_plan($queryId, $input)
{
    $procedureName = '';
    $params = [];

    // each case mirrors one preset card in the frontend catalog.
    switch ($queryId) {
        case 'q1':
            $procedureName = 'sp_query_q1';
            $params = [
                read_int_param($input, 'min_release_year', 2021),
                read_int_param($input, 'min_reviews', 10),
                read_int_param($input, 'limit', 15),
            ];
            break;

        case 'q2':
            $procedureName = 'sp_query_q2';
            $params = [
                read_int_param($input, 'min_reviews', 10000),
                read_float_param($input, 'min_recommendation_pct', 80.0),
                read_int_param($input, 'limit', 15),
            ];
            break;

        case 'q3':
            $procedureName = 'sp_query_q3';
            $params = [read_int_param($input, 'limit', 30)];
            break;

        case 'q4':
            $procedureName = 'sp_query_q4';
            $params = [read_int_param($input, 'limit', 20)];
            break;

        case 'q5':
            $procedureName = 'sp_query_q5';
            $params = [
                read_int_param($input, 'min_genres', 2),
                read_int_param($input, 'min_games', 2),
                read_int_param($input, 'min_reviews', 20),
                read_int_param($input, 'limit', 20),
            ];
            break;

        case 'q6':
            $procedureName = 'sp_query_q6';
            $params = [read_int_param($input, 'limit', 30)];
            break;

        case 'q7':
            $procedureName = 'sp_query_q7';
            $params = [
                read_string_param($input, 'genre_keyword', ''),
                read_int_param($input, 'limit', 40),
            ];
            break;

        case 'q8':
            $procedureName = 'sp_query_q8';
            $params = [
                read_string_param($input, 'feature_keyword', 'multi'),
                read_int_param($input, 'min_reviews', 10),
                read_int_param($input, 'limit', 20),
            ];
            break;

        case 'q9':
            $procedureName = 'sp_query_q9';
            $params = [
                read_int_param($input, 'min_reviews', 20),
                read_int_param($input, 'limit', 20),
            ];
            break;

        case 'q10':
            $procedureName = 'sp_query_q10';
            $params = [
                read_int_param($input, 'min_reviews', 20),
                read_int_param($input, 'limit', 20),
            ];
            break;

        case 'q11':
            $procedureName = 'sp_query_q11';
            $params = [
                read_int_param($input, 'min_platforms', 2),
                read_int_param($input, 'limit', 20),
            ];
            break;

        case 'q12':
            $procedureName = 'sp_query_q12';
            $params = [
                read_int_param($input, 'top_limit', 50),
                read_int_param($input, 'limit', 25),
            ];
            break;

        case 'q13':
            $procedureName = 'sp_query_q13';
            $params = [read_int_param($input, 'limit', 12)];
            break;

        case 'q14':
            $procedureName = 'sp_query_q14';
            $params = [read_int_param($input, 'limit', 50)];
            break;

        case 'q15':
            $procedureName = 'sp_query_q15';
            $params = [read_int_param($input, 'limit', 20)];
            break;

        default:
            throw new InvalidArgumentException('Unknown query.');
    }

    // returns both executable sql and the params that fill its placeholders.
    return [
        'procedureName' => $procedureName,
        'params' => $params,
        'sql' => build_call_sql($procedureName, $params),
    ];
}

// clamps a numeric input so custom queries cannot request excessive rows.
function read_limited_int_param($input, $key, $default, $min, $max)
{
    $value = read_int_param($input, $key, $default);

    // enforces the lower bound before the value reaches sql.
    if ($value < $min) {
        return $min;
    }

    // enforces the upper bound before the value reaches sql.
    if ($value > $max) {
        return $max;
    }

    return $value;
}

// reads optional numeric filters where blank means no filter.
function read_optional_float_param($input, $key)
{
    if (!isset($input[$key]) || $input[$key] === '') {
        return null;
    }

    return (float) $input[$key];
}

// builds the filtered custom query from safe clauses and bound parameters.
function build_custom_query_plan($input)
{
    // the starter where clause keeps later filters easy to join with and.
    $whereClauses = ['1 = 1'];
    $havingClauses = [];
    $params = [];

    $titleKeyword = trim(read_string_param($input, 'title_keyword', ''));
    $genreKeyword = trim(read_string_param($input, 'genre_keyword', ''));
    $minReleaseYear = read_int_param($input, 'min_release_year', 2018);
    $maxPrice = read_optional_float_param($input, 'max_price');
    $minReviews = read_int_param($input, 'min_reviews', 10);
    $limit = read_limited_int_param($input, 'limit', 25, 1, 100);
    $sortBy = read_string_param($input, 'sort_by', 'reviews');

    // title and genre filters use like patterns while staying parameterized.
    if ($titleKeyword !== '') {
        $whereClauses[] = 'g.Title LIKE ?';
        $params[] = '%' . $titleKeyword . '%';
    }

    // checks genre membership without multiplying rows in the main result.
    if ($genreKeyword !== '') {
        $whereClauses[] = 'EXISTS (
            SELECT 1
            FROM ClassifiedAs ca
            WHERE ca.GameID = g.GameID
              AND ca.GenreName LIKE ?
        )';
        $params[] = '%' . $genreKeyword . '%';
    }

    // release year and price filters apply before aggregation.
    if ($minReleaseYear > 0) {
        $whereClauses[] = 'YEAR(g.ReleaseDate) >= ?';
        $params[] = $minReleaseYear;
    }

    // price is optional, so blank input leaves the filter out entirely.
    if ($maxPrice !== null) {
        $whereClauses[] = 'g.Price <= ?';
        $params[] = $maxPrice;
    }

    // review count is aggregated, so it belongs in having instead of where.
    if ($minReviews > 0) {
        $havingClauses[] = 'COUNT(r.ReviewID) >= ?';
        $params[] = $minReviews;
    }

    // only allows known sort expressions so order by cannot be user supplied sql.
    $orderByOptions = [
        'reviews' => 'ReviewCount DESC, RecommendationPct DESC, g.Title',
        'recommendation' => 'RecommendationPct DESC, ReviewCount DESC, g.Title',
        'recent' => 'g.ReleaseDate DESC, ReviewCount DESC, g.Title',
        'price' => 'g.Price ASC, ReviewCount DESC, g.Title',
    ];
    $orderBy = $orderByOptions[$sortBy] ?? $orderByOptions['reviews'];

    // selects display fields plus aggregate metrics for the custom result table.
    $sql = '
        SELECT
            CAST(g.GameID AS CHAR) AS GameID,
            g.Title,
            YEAR(g.ReleaseDate) AS ReleaseYear,
            DATE_FORMAT(g.ReleaseDate, \'%Y-%m-%d\') AS ReleaseDate,
            ROUND(g.Price, 2) AS Price,
            COUNT(r.ReviewID) AS ReviewCount,
            ROUND(100 * AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END), 2) AS RecommendationPct
        FROM Game g
        LEFT JOIN Review r ON g.GameID = r.GameID
        WHERE ' . implode(' AND ', $whereClauses) . '
        GROUP BY g.GameID, g.Title, g.ReleaseDate, g.Price';

    // adds aggregate filters only when the form requested them.
    if (count($havingClauses) > 0) {
        $sql .= '
        HAVING ' . implode(' AND ', $havingClauses);
    }

    // appends validated ordering and a clamped limit.
    $sql .= '
        ORDER BY ' . $orderBy . '
        LIMIT ' . $limit;

    // exposes the sql and params so the frontend can show how the query ran.
    return [
        'params' => $params,
        'sql' => $sql,
    ];
}

// converts a mysqli result into column metadata and row objects.
function fetch_query_rows($statement)
{
    $result = $statement->get_result();

    // procedures without a result set return an empty table shape.
    if ($result === false) {
        if ($statement->field_count > 0) {
            throw new RuntimeException('Could not read query results.');
        }

        return [
            'columns' => [],
            'rows' => [],
        ];
    }

    $columns = [];
    $rows = [];
    $fields = $result->fetch_fields();

    // records column names so the frontend can build a generic table.
    foreach ($fields as $field) {
        $columns[] = $field->name;
    }

    // fetches associative rows to preserve column names in json.
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    $result->free();

    return [
        'columns' => $columns,
        'rows' => $rows,
    ];
}

// clears extra result sets left behind by stored procedure calls.
function flush_pending_results($connection)
{
    while ($connection->more_results()) {
        $connection->next_result();
        $extraResult = $connection->store_result();

        // frees any extra result object to keep the connection reusable.
        if ($extraResult instanceof mysqli_result) {
            $extraResult->free();
        }
    }
}

// runs the custom filtered query and formats the shared response payload.
function execute_custom_query($connection, $input)
{
    $plan = build_custom_query_plan($input);
    $query = $plan['sql'];
    $stmt = $connection->prepare($query);

    // prepare failures usually mean the generated sql is invalid.
    if ($stmt === false) {
        throw new RuntimeException('Could not prepare filtered query.');
    }

    $params = $plan['params'];

    // binds values only when filters created placeholders.
    if (count($params) > 0) {
        $paramTypes = build_param_type_string($params);
        $didBind = $stmt->bind_param($paramTypes, ...$params);

        if (!$didBind) {
            $stmt->close();
            flush_pending_results($connection);
            throw new RuntimeException('Could not bind filtered query parameters.');
        }
    }

    $didExecute = $stmt->execute();

    // closes and flushes before raising so later requests are not poisoned.
    if (!$didExecute) {
        $stmt->close();
        flush_pending_results($connection);
        throw new RuntimeException('Could not run filtered query.');
    }

    $resultData = fetch_query_rows($stmt);

    $stmt->close();
    flush_pending_results($connection);

    return [
        'columns' => $resultData['columns'],
        'rows' => $resultData['rows'],
        'rowCount' => count($resultData['rows']),
        'sql' => trim($query),
        'params' => $params,
    ];
}

// runs a preset stored procedure and formats the shared response payload.
function execute_query($connection, $queryId, $input)
{
    // rejects empty selection before preparing a stored procedure call.
    if ($queryId === '') {
        throw new InvalidArgumentException('A query id is required.');
    }

    $plan = build_query_plan($queryId, $input);
    $query = $plan['sql'];
    $stmt = $connection->prepare($query);

    // prepare failures usually mean a procedure name or signature changed.
    if ($stmt === false) {
        throw new RuntimeException('Could not prepare query.');
    }

    $params = $plan['params'];

    if (count($params) > 0) {
        $paramTypes = build_param_type_string($params);
        $didBind = $stmt->bind_param($paramTypes, ...$params);

        if (!$didBind) {
            $stmt->close();
            flush_pending_results($connection);
            throw new RuntimeException('Could not bind query parameters.');
        }
    }

    $didExecute = $stmt->execute();

    // closes and flushes before raising so later requests are not poisoned.
    if (!$didExecute) {
        $stmt->close();
        flush_pending_results($connection);
        throw new RuntimeException('Could not run query.');
    }

    $resultData = fetch_query_rows($stmt);

    $stmt->close();
    flush_pending_results($connection);

    // includes sql and params so the frontend can expose useful run details.
    return [
        'columns' => $resultData['columns'],
        'rows' => $resultData['rows'],
        'rowCount' => count($resultData['rows']),
        'sql' => $query,
        'params' => $params,
    ];
}
