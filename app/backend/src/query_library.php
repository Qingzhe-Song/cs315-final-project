<?php

function read_int_param($input, $key, $default)
{
    if (!isset($input[$key]) || $input[$key] === '') {
        return $default;
    }

    return (int) $input[$key];
}

function read_float_param($input, $key, $default)
{
    if (!isset($input[$key]) || $input[$key] === '') {
        return $default;
    }

    return (float) $input[$key];
}

function read_string_param($input, $key, $default)
{
    if (!isset($input[$key])) {
        return $default;
    }

    return (string) $input[$key];
}

function build_call_sql($procedureName, $params)
{
    if (count($params) === 0) {
        return 'CALL ' . $procedureName . '()';
    }

    $placeholders = array_fill(0, count($params), '?');
    return 'CALL ' . $procedureName . '(' . implode(', ', $placeholders) . ')';
}

function build_query_plan($queryId, $input)
{
    $procedureName = '';
    $params = [];

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

    return [
        'procedureName' => $procedureName,
        'params' => $params,
        'sql' => build_call_sql($procedureName, $params),
    ];
}

function fetch_query_rows($statement)
{
    $result = $statement->get_result();

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

    foreach ($fields as $field) {
        $columns[] = $field->name;
    }

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    $result->free();

    return [
        'columns' => $columns,
        'rows' => $rows,
    ];
}

function flush_pending_results($connection)
{
    while ($connection->more_results()) {
        $connection->next_result();
        $extraResult = $connection->store_result();

        if ($extraResult instanceof mysqli_result) {
            $extraResult->free();
        }
    }
}

function execute_query($connection, $queryId, $input)
{
    if ($queryId === '') {
        throw new InvalidArgumentException('A query id is required.');
    }

    $plan = build_query_plan($queryId, $input);
    $startedAt = microtime(true);
    $statement = $connection->prepare($plan['sql']);

    if ($statement === false) {
        throw new RuntimeException('Could not prepare query.');
    }

    $didExecute = $statement->execute($plan['params']);

    if (!$didExecute) {
        $statement->close();
        flush_pending_results($connection);
        throw new RuntimeException('Could not run query.');
    }

    $resultData = fetch_query_rows($statement);

    $statement->close();
    flush_pending_results($connection);

    return [
        'columns' => $resultData['columns'],
        'rows' => $resultData['rows'],
        'rowCount' => count($resultData['rows']),
        'sql' => $plan['sql'],
        'params' => $plan['params'],
        'durationMs' => round((microtime(true) - $startedAt) * 1000, 2),
    ];
}
