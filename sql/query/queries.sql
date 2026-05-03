-- 1. which genres have the highest average recommendation rate among games released after 2020?
SELECT
    -- report one row per genre with both game coverage and review volume.
    ca.GenreName,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
    -- convert boolean recommendations into 1/0 values so avg becomes a percentage.
    ROUND(
        AVG(
            CASE
                WHEN r.IsRecommended THEN 1
                ELSE 0
            END
        ) * 100,
        2
    ) AS AvgRecommendationPct
FROM
    Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN Review r ON g.GameID = r.GameID
WHERE
    -- restrict the analysis to games released in 2021 or later.
    g.ReleaseDate >= '2021-01-01'
GROUP BY
    ca.GenreName
HAVING
    -- require enough reviews so one or two reviews do not dominate a genre.
    COUNT(r.ReviewID) >= 10
ORDER BY
    -- rank by sentiment first, using review count as the tie-breaker.
    AvgRecommendationPct DESC,
    NumReviews DESC;

-- 2. which publishers have released the largest number of games that have both high recommendation rates and high review counts?
WITH
    -- keep only games that are both heavily reviewed and at least 80% recommended.
    high_perf AS (
        SELECT
            g.GameID
        FROM
            Game g
            JOIN Review r ON g.GameID = r.GameID
        GROUP BY
            g.GameID
        HAVING
            COUNT(r.ReviewID) >= 10000
            AND AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) >= 0.80
    )
SELECT
    pb.PublisherName,
    COUNT(*) AS NumHighPerformingGames
FROM
    -- join the filtered game list to publishers so publishers are counted only for qualifying games.
    high_perf hp
    JOIN PublishedBy pb ON hp.GameID = pb.GameID
GROUP BY
    pb.PublisherName
ORDER BY
    -- publishers with more qualifying games appear first; name sorting makes ties stable.
    NumHighPerformingGames DESC,
    pb.PublisherName;

-- 3. for each release year, which genre had the highest average review count per game?
WITH
    -- count reviews per game once so later averages treat each game as one observation.
    review_counts AS (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount
        FROM
            Review
        GROUP BY
            GameID
    ),
    -- average those per-game counts by release year and genre.
    yearly AS (
        SELECT
            YEAR (g.ReleaseDate) AS YearReleased,
            ca.GenreName,
            AVG(rc.ReviewCount) AS AvgReviewsPerGame
        FROM
            Game g
            JOIN ClassifiedAs ca ON g.GameID = ca.GameID
            JOIN review_counts rc ON g.GameID = rc.GameID
        GROUP BY
            YEAR (g.ReleaseDate),
            ca.GenreName
    ),
    -- find the highest genre average for each release year.
    best AS (
        SELECT
            YearReleased,
            MAX(AvgReviewsPerGame) AS MaxAvgReviewsPerGame
        FROM
            yearly
        GROUP BY
            YearReleased
    )
SELECT
    y.YearReleased,
    y.GenreName,
    ROUND(y.AvgReviewsPerGame, 2) AS AvgReviewsPerGame
FROM
    yearly y
    -- keep genres whose average exactly matches the yearly maximum.
    JOIN best b ON y.YearReleased = b.YearReleased
    AND y.AvgReviewsPerGame = b.MaxAvgReviewsPerGame
ORDER BY
    y.YearReleased;

-- 4. which games have unusually high review counts despite having below-average recommendation rates compared with other games released in the same year?
WITH
    -- build one row per game with its review count and recommendation percentage.
    per_game AS (
        SELECT
            g.GameID,
            g.Title,
            g.ReleaseDate,
            COUNT(r.ReviewID) AS ReviewCount,
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM
            Game g
            JOIN Review r ON g.GameID = r.GameID
        GROUP BY
            g.GameID,
            g.Title,
            g.ReleaseDate
    ),
    -- compute the baseline review count and sentiment for each release year.
    year_averages AS (
        SELECT
            YEAR (ReleaseDate) AS ReleaseYear,
            AVG(ReviewCount) AS AvgYearReviewCount,
            AVG(RecommendationPct) AS AvgYearRecommendationPct
        FROM
            per_game
        GROUP BY
            YEAR (ReleaseDate)
    )
SELECT
    pg.Title,
    YEAR (pg.ReleaseDate) AS ReleaseYear,
    pg.ReviewCount,
    ROUND(pg.RecommendationPct, 2) AS RecommendationPct,
    ROUND(ya.AvgYearReviewCount, 2) AS AvgYearReviewCount,
    ROUND(ya.AvgYearRecommendationPct, 2) AS AvgYearRecommendationPct
FROM
    per_game pg
    JOIN year_averages ya ON YEAR (pg.ReleaseDate) = ya.ReleaseYear
WHERE
    -- flag games that are more discussed than average but less liked than average for their year.
    pg.ReviewCount > ya.AvgYearReviewCount
    AND pg.RecommendationPct < ya.AvgYearRecommendationPct
ORDER BY
    -- put the most visible low-sentiment outliers first.
    pg.ReviewCount DESC,
    pg.RecommendationPct ASC;

-- 5. which developers consistently produce games with high recommendation rates across multiple genres?
SELECT
    -- count distinct genres and games so duplicated reviews do not inflate breadth metrics.
    db.DeveloperName,
    COUNT(DISTINCT ca.GenreName) AS NumGenres,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
    ROUND(
        AVG(
            CASE
                WHEN r.IsRecommended THEN 1
                ELSE 0
            END
        ) * 100,
        2
    ) AS AvgRecommendationPct
FROM
    -- join through games so developer, genre, and review data can be aggregated together.
    DevelopedBy db
    JOIN Game g ON db.GameID = g.GameID
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN Review r ON g.GameID = r.GameID
GROUP BY
    db.DeveloperName
HAVING
    -- require breadth across genres, multiple games, and enough reviews for a stable rate.
    COUNT(DISTINCT ca.GenreName) >= 2
    AND COUNT(DISTINCT g.GameID) >= 2
    AND COUNT(r.ReviewID) >= 20
ORDER BY
    -- rank quality first, then reward broader catalogs.
    AvgRecommendationPct DESC,
    NumGenres DESC,
    NumGames DESC;

-- 6. how does price relate to popularity within each genre?
WITH
    -- summarize reviews per game so price buckets compare game-level performance.
    game_review_stats AS (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount,
            AVG(
                CASE
                    WHEN IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM
            Review
        GROUP BY
            GameID
    ),
    -- convert numeric prices into readable ranges for grouped comparison.
    priced_games AS (
        SELECT
            GameID,
            CASE
                WHEN Price = 0 THEN 'Free'
                WHEN Price < 10 THEN 'Under $10'
                WHEN Price < 30 THEN '$10-$29.99'
                WHEN Price < 60 THEN '$30-$59.99'
                ELSE '$60+'
            END AS PriceRange
        FROM
            Game
    )
SELECT
    ca.GenreName,
    pg.PriceRange,
    COUNT(DISTINCT pg.GameID) AS NumGames,
    ROUND(AVG(grs.ReviewCount), 2) AS AvgReviewsPerGame,
    ROUND(
        AVG(
            CASE
                WHEN grs.ReviewCount > 0 THEN grs.RecommendationPct
            END
        ),
        2
    ) AS AvgRecommendationPct
FROM
    -- join bucketed prices to genres and game-level review stats.
    priced_games pg
    JOIN ClassifiedAs ca ON pg.GameID = ca.GameID
    JOIN game_review_stats grs ON pg.GameID = grs.GameID
GROUP BY
    ca.GenreName,
    pg.PriceRange
ORDER BY
    -- keep each genre together and show its highest-engagement price ranges first.
    ca.GenreName,
    AvgReviewsPerGame DESC;

-- 7. which genres show the strongest growth in both released games and review activity over time?
SELECT
    -- group by release year and genre to show the timeline for each genre.
    YEAR (g.ReleaseDate) AS ReleaseYear,
    ca.GenreName,
    COUNT(DISTINCT g.GameID) AS NumReleasedGames,
    COUNT(r.ReviewID) AS TotalReviews,
    ROUND(
        AVG(
            CASE
                WHEN r.IsRecommended THEN 1
                ELSE 0
            END
        ) * 100,
        2
    ) AS AvgRecommendationPct
FROM
    Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    -- left join keeps released games even if they have no reviews.
    LEFT JOIN Review r ON g.GameID = r.GameID
GROUP BY
    YEAR (g.ReleaseDate),
    ca.GenreName
ORDER BY
    -- sort chronologically within each genre for trend reading.
    ca.GenreName,
    ReleaseYear;

-- 8. among multiplayer-supported games, which tags are associated with the highest user engagement?
SELECT
    -- aggregate tag-level engagement across games that match multiplayer features.
    tw.TagName,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
    ROUND(AVG(r.HelpfulVotes), 2) AS AvgHelpfulVotes,
    ROUND(AVG(r.HoursPlayed), 2) AS AvgHoursPlayed,
    ROUND(
        AVG(
            CASE
                WHEN r.IsRecommended THEN 1
                ELSE 0
            END
        ) * 100,
        2
    ) AS AvgRecommendationPct
FROM
    Game g
    JOIN HasFeatures hf ON g.GameID = hf.GameID
    JOIN TaggedWith tw ON g.GameID = tw.GameID
    JOIN Review r ON g.GameID = r.GameID
WHERE
    -- match feature names such as multiplayer or online multi-player without depending on exact casing.
    LOWER(hf.FeatureName) LIKE '%multi%'
GROUP BY
    tw.TagName
HAVING
    -- require enough reviews so engagement averages are meaningful.
    COUNT(r.ReviewID) >= 10
ORDER BY
    -- helpful votes and playtime are used as engagement signals before raw review volume.
    AvgHelpfulVotes DESC,
    AvgHoursPlayed DESC,
    NumReviews DESC;

-- 9. which games have the greatest mismatch between popularity and sentiment?
SELECT
    g.Title,
    COUNT(r.ReviewID) AS ReviewCount,
    ROUND(
        AVG(
            CASE
                WHEN r.IsRecommended THEN 1
                ELSE 0
            END
        ) * 100,
        2
    ) AS RecommendationPct,
    -- popularity-sentiment mismatch rises when many reviews are not recommendations.
    ROUND(
        COUNT(r.ReviewID) * (
            1 - AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            )
        ),
        2
    ) AS MismatchScore
FROM
    Game g
    JOIN Review r ON g.GameID = r.GameID
GROUP BY
    g.GameID,
    g.Title
HAVING
    -- only compare games with enough reviews and below 30% recommendation rate.
    COUNT(r.ReviewID) >= 20
    AND AVG(
        CASE
            WHEN r.IsRecommended THEN 1
            ELSE 0
        END
    ) < 0.30
ORDER BY
    -- highest mismatch comes first, with review count breaking ties.
    MismatchScore DESC,
    ReviewCount DESC;

-- 10. which publishers release the largest number of popular games?
WITH
    -- build review totals and sentiment once per game before grouping by publisher.
    game_review_stats AS (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount,
            AVG(
                CASE
                    WHEN IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM
            Review
        GROUP BY
            GameID
    )
SELECT
    pb.PublisherName,
    COUNT(DISTINCT g.GameID) AS NumPopularGames,
    ROUND(AVG(grs.ReviewCount), 2) AS AvgReviewsPerGame,
    ROUND(AVG(grs.RecommendationPct), 2) AS AvgRecommendationPct
FROM
    -- attach publishers to games that have game-level review statistics.
    Game g
    JOIN PublishedBy pb ON g.GameID = pb.GameID
    JOIN game_review_stats grs ON g.GameID = grs.GameID
WHERE
    -- define "popular" as at least 20 reviews in this fixed query version.
    grs.ReviewCount >= 20
GROUP BY
    pb.PublisherName
HAVING
    -- require at least five popular games so publishers with one hit do not dominate.
    COUNT(DISTINCT g.GameID) >= 5
ORDER BY
    -- rank by catalog count, then by average sentiment across those games.
    NumPopularGames DESC,
    AvgRecommendationPct DESC;

-- 11. for games that support multiple operating systems, how does review activity differ?
SELECT
    g.Title,
    -- distinct avoids counting duplicate platform rows if they exist.
    COUNT(DISTINCT s.PlatformName) AS NumPlatforms,
    COUNT(r.ReviewID) AS ReviewCount,
    ROUND(
        AVG(
            CASE
                WHEN r.IsRecommended THEN 1
                ELSE 0
            END
        ) * 100,
        2
    ) AS RecommendationPct
FROM
    Game g
    JOIN Supports s ON g.GameID = s.GameID
    -- left join includes multi-platform games even if they have no reviews.
    LEFT JOIN Review r ON g.GameID = r.GameID
GROUP BY
    g.GameID,
    g.Title
HAVING
    -- focus on games that support at least two platforms.
    COUNT(DISTINCT s.PlatformName) >= 2
ORDER BY
    -- show broadest platform support first, then most-reviewed and best-recommended games.
    NumPlatforms DESC,
    ReviewCount DESC,
    RecommendationPct DESC;

-- 12. what characteristics are most common among the top-reviewed games?
WITH
    -- build game-level popularity and sentiment metrics.
    game_review_stats AS (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount,
            AVG(
                CASE
                    WHEN IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM
            Review
        GROUP BY
            GameID
    ),
    -- keep only the 50 games with the most reviews.
    top_games AS (
        SELECT
            GameID
        FROM
            game_review_stats
        ORDER BY
            ReviewCount DESC
        LIMIT
            50
    ),
    -- bucket prices so top-game characteristics can be summarized by range.
    priced_games AS (
        SELECT
            GameID,
            CASE
                WHEN Price = 0 THEN 'Free'
                WHEN Price < 10 THEN 'Under $10'
                WHEN Price < 30 THEN '$10-$29.99'
                WHEN Price < 60 THEN '$30-$59.99'
                ELSE '$60+'
            END AS PriceRange
        FROM
            Game
    )
SELECT
    ca.GenreName,
    pg.PriceRange,
    COUNT(DISTINCT g.GameID) AS NumTopGames,
    ROUND(AVG(grs.ReviewCount), 2) AS AvgReviews,
    ROUND(AVG(grs.RecommendationPct), 2) AS AvgRecommendationPct
FROM
    -- join top games to genre, price, and review metrics for characteristic summaries.
    Game g
    JOIN top_games tg ON g.GameID = tg.GameID
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN game_review_stats grs ON g.GameID = grs.GameID
    JOIN priced_games pg ON g.GameID = pg.GameID
GROUP BY
    ca.GenreName,
    pg.PriceRange
ORDER BY
    -- most common genre-price combinations appear first, with sentiment as the tie-breaker.
    NumTopGames DESC,
    AvgRecommendationPct DESC;

-- 13. which release months are associated with the highest average review counts and recommendation rates?
SELECT
    -- month extracts the calendar month regardless of release year.
    MONTH (g.ReleaseDate) AS ReleaseMonth,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
    -- divide reviews by distinct games to compare months with different release counts.
    ROUND(COUNT(r.ReviewID) / COUNT(DISTINCT g.GameID), 2) AS AvgReviewsPerGame,
    ROUND(
        AVG(
            CASE
                WHEN r.IsRecommended THEN 1
                ELSE 0
            END
        ) * 100,
        2
    ) AS AvgRecommendationPct
FROM
    Game g
    JOIN Review r ON g.GameID = r.GameID
GROUP BY
    MONTH (g.ReleaseDate)
ORDER BY
    -- rank months by average attention first, then by recommendation rate.
    AvgReviewsPerGame DESC,
    AvgRecommendationPct DESC;

-- 14. which games released in the same year and genre show the largest differences in review count?
WITH
    -- create one review-count row for each game within each release-year and genre combination.
    game_review_counts AS (
        SELECT
            g.GameID,
            g.Title,
            YEAR (g.ReleaseDate) AS ReleaseYear,
            ca.GenreName,
            COUNT(r.ReviewID) AS ReviewCount
        FROM
            Game g
            JOIN ClassifiedAs ca ON g.GameID = ca.GameID
            JOIN Review r ON g.GameID = r.GameID
        GROUP BY
            g.GameID,
            g.Title,
            YEAR (g.ReleaseDate),
            ca.GenreName
    )
SELECT
    a.ReleaseYear,
    a.GenreName,
    a.Title AS MoreReviewedGame,
    b.Title AS LessReviewedGame,
    a.ReviewCount AS MoreReviewedCount,
    b.ReviewCount AS LessReviewedCount,
    (a.ReviewCount - b.ReviewCount) AS ReviewCountGap
FROM
    game_review_counts a
    -- pair games only when they share release year and genre; gameid ordering avoids duplicate pair reversals.
    JOIN game_review_counts b ON a.ReleaseYear = b.ReleaseYear
    AND a.GenreName = b.GenreName
    AND a.GameID < b.GameID
WHERE
    -- keep only pairs where alias a is the more-reviewed game.
    a.ReviewCount > b.ReviewCount
ORDER BY
    -- largest review-count gaps are the main result.
    ReviewCountGap DESC,
    a.ReleaseYear,
    a.GenreName
LIMIT
    50;

-- 15. which features are associated with the highest average recommendation rates and review counts?
WITH
    -- build per-game review count and recommendation percentage before joining to features.
    game_stats AS (
        SELECT
            g.GameID,
            COUNT(r.ReviewID) AS ReviewCount,
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM
            Game g
            JOIN Review r ON g.GameID = r.GameID
        GROUP BY
            g.GameID
    )
SELECT
    hf.FeatureName,
    COUNT(DISTINCT gs.GameID) AS NumGames,
    ROUND(AVG(gs.ReviewCount), 2) AS AvgReviewCount,
    ROUND(AVG(gs.RecommendationPct), 2) AS AvgRecommendationPct
FROM
    game_stats gs
    -- join each game-level statistic to all features that game supports.
    JOIN HasFeatures hf ON gs.GameID = hf.GameID
GROUP BY
    hf.FeatureName
HAVING
    -- require at least five games for a feature-level average.
    COUNT(DISTINCT gs.GameID) >= 5
ORDER BY
    -- rank features by sentiment first, then review volume and coverage.
    AvgRecommendationPct DESC,
    AvgReviewCount DESC,
    NumGames DESC;
