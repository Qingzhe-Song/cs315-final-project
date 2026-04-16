-- 1. Which genres have the highest average recommendation rate among games released after 2020?
SELECT
    ca.GenreName,
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
    Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN Review r ON g.GameID = r.GameID
WHERE
    g.ReleaseDate >= '2021-01-01'
GROUP BY
    ca.GenreName
HAVING
    COUNT(r.ReviewID) >= 10
ORDER BY
    AvgRecommendationPct DESC,
    NumReviews DESC;

-- 2. Which publishers have released the largest number of games that have both high recommendation rates and high review counts?
SELECT
    pb.PublisherName,
    COUNT(*) AS NumHighPerformingGames
FROM
    (
        SELECT
            g.GameID
        FROM
            Game g
            JOIN Review r ON g.GameID = r.GameID
        GROUP BY
            g.GameID
        HAVING
            COUNT(r.ReviewID) >= 20
            AND AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) >= 0.80
    ) AS high_perf
    JOIN PublishedBy pb ON high_perf.GameID = pb.GameID
GROUP BY
    pb.PublisherName
ORDER BY
    NumHighPerformingGames DESC,
    pb.PublisherName;

-- 3. For each release year, which genre had the highest average review count per game?
SELECT
    yearly.YearReleased,
    yearly.GenreName,
    yearly.AvgReviewsPerGame
FROM
    (
        SELECT
            YEAR (g.ReleaseDate) AS YearReleased,
            ca.GenreName,
            ROUND(AVG(gr.ReviewCount), 2) AS AvgReviewsPerGame
        FROM
            Game g
            JOIN ClassifiedAs ca ON g.GameID = ca.GameID
            JOIN (
                SELECT
                    GameID,
                    COUNT(*) AS ReviewCount
                FROM
                    Review
                GROUP BY
                    GameID
            ) AS gr ON g.GameID = gr.GameID
        GROUP BY
            YEAR (g.ReleaseDate),
            ca.GenreName
    ) AS yearly
    JOIN (
        SELECT
            x.YearReleased,
            MAX(x.AvgReviewsPerGame) AS MaxAvgReviewsPerGame
        FROM
            (
                SELECT
                    YEAR (g.ReleaseDate) AS YearReleased,
                    ca.GenreName,
                    AVG(gr.ReviewCount) AS AvgReviewsPerGame
                FROM
                    Game g
                    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
                    JOIN (
                        SELECT
                            GameID,
                            COUNT(*) AS ReviewCount
                        FROM
                            Review
                        GROUP BY
                            GameID
                    ) AS gr ON g.GameID = gr.GameID
                GROUP BY
                    YEAR (g.ReleaseDate),
                    ca.GenreName
            ) AS x
        GROUP BY
            x.YearReleased
    ) AS best ON yearly.YearReleased = best.YearReleased
    AND yearly.AvgReviewsPerGame = best.MaxAvgReviewsPerGame
ORDER BY
    yearly.YearReleased;

-- 4. Which games have unusually high review counts despite having below-average recommendation rates compared with other games released in the same year?
SELECT
    pg.Title,
    YEAR (pg.ReleaseDate) AS ReleaseYear,
    pg.ReviewCount,
    ROUND(pg.RecommendationPct, 2) AS RecommendationPct,
    ROUND(ya.AvgYearReviewCount, 2) AS AvgYearReviewCount,
    ROUND(ya.AvgYearRecommendationPct, 2) AS AvgYearRecommendationPct
FROM
    (
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
    ) AS pg
    JOIN (
        SELECT
            t.ReleaseYear,
            AVG(t.ReviewCount) AS AvgYearReviewCount,
            AVG(t.RecommendationPct) AS AvgYearRecommendationPct
        FROM
            (
                SELECT
                    YEAR (g.ReleaseDate) AS ReleaseYear,
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
                    YEAR (g.ReleaseDate),
                    g.GameID
            ) AS t
        GROUP BY
            t.ReleaseYear
    ) AS ya ON YEAR (pg.ReleaseDate) = ya.ReleaseYear
WHERE
    pg.ReviewCount > ya.AvgYearReviewCount
    AND pg.RecommendationPct < ya.AvgYearRecommendationPct
ORDER BY
    pg.ReviewCount DESC,
    pg.RecommendationPct ASC;

-- 5. Which developers consistently produce games with high recommendation rates across multiple genres?
SELECT
    d.DeveloperName,
    d.DeveloperType,
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
    Developer d
    JOIN DevelopedBy db ON d.DeveloperName = db.DeveloperName
    JOIN Game g ON db.GameID = g.GameID
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN Review r ON g.GameID = r.GameID
GROUP BY
    d.DeveloperName,
    d.DeveloperType
HAVING
    COUNT(DISTINCT ca.GenreName) >= 2
    AND COUNT(DISTINCT g.GameID) >= 2
    AND COUNT(r.ReviewID) >= 20
ORDER BY
    AvgRecommendationPct DESC,
    NumGenres DESC,
    NumGames DESC;

-- 6. How does price relate to popularity within each genre?
SELECT
    ca.GenreName,
    CASE
        WHEN g.Price = 0 THEN 'Free'
        WHEN g.Price < 10 THEN 'Under $10'
        WHEN g.Price < 30 THEN '$10-$29.99'
        WHEN g.Price < 60 THEN '$30-$59.99'
        ELSE '$60+'
    END AS PriceRange,
    COUNT(DISTINCT g.GameID) AS NumGames,
    ROUND(AVG(gr.ReviewCount), 2) AS AvgReviewsPerGame,
    ROUND(
        AVG(
            CASE
                WHEN gr.ReviewCount > 0 THEN gr.RecommendationPct
            END
        ),
        2
    ) AS AvgRecommendationPct
FROM
    Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN (
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
    ) AS gr ON g.GameID = gr.GameID
GROUP BY
    ca.GenreName,
    CASE
        WHEN g.Price = 0 THEN 'Free'
        WHEN g.Price < 10 THEN 'Under $10'
        WHEN g.Price < 30 THEN '$10-$29.99'
        WHEN g.Price < 60 THEN '$30-$59.99'
        ELSE '$60+'
    END
ORDER BY
    ca.GenreName,
    AvgReviewsPerGame DESC;

-- 7. Which genres show the strongest growth in both released games and review activity over time?
SELECT
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
    LEFT JOIN Review r ON g.GameID = r.GameID
GROUP BY
    YEAR (g.ReleaseDate),
    ca.GenreName
ORDER BY
    ca.GenreName,
    ReleaseYear;

-- 8. Among multiplayer-supported games, which tags are associated with the highest user engagement?
SELECT
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
    LOWER(hf.FeatureName) LIKE '%multi%'
GROUP BY
    tw.TagName
HAVING
    COUNT(r.ReviewID) >= 10
ORDER BY
    AvgHelpfulVotes DESC,
    AvgHoursPlayed DESC,
    NumReviews DESC;

-- 9. Which games have the greatest mismatch between popularity and sentiment?
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
    COUNT(r.ReviewID) >= 20
ORDER BY
    MismatchScore DESC,
    ReviewCount DESC;

-- 10. Which publishers release the largest number of popular games within each developer type?
SELECT
    pb.PublisherName,
    d.DeveloperType,
    COUNT(DISTINCT g.GameID) AS NumPopularGames,
    ROUND(AVG(gr.ReviewCount), 2) AS AvgReviewsPerGame,
    ROUND(AVG(gr.RecommendationPct), 2) AS AvgRecommendationPct
FROM
    Game g
    JOIN PublishedBy pb ON g.GameID = pb.GameID
    JOIN DevelopedBy db ON g.GameID = db.GameID
    JOIN Developer d ON db.DeveloperName = d.DeveloperName
    JOIN (
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
    ) AS gr ON g.GameID = gr.GameID
WHERE
    gr.ReviewCount >= 20
GROUP BY
    pb.PublisherName,
    d.DeveloperType
ORDER BY
    NumPopularGames DESC,
    AvgRecommendationPct DESC;

-- 11. For games that support multiple operating systems, how does review activity differ?
SELECT
    g.Title,
    COUNT(DISTINCT s.PlatformName) AS NumPlatforms,
    GROUP_CONCAT (
        DISTINCT s.PlatformName
        ORDER BY
            s.PlatformName SEPARATOR ', '
    ) AS Platforms,
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
    LEFT JOIN Review r ON g.GameID = r.GameID
GROUP BY
    g.GameID,
    g.Title
HAVING
    COUNT(DISTINCT s.PlatformName) >= 2
ORDER BY
    NumPlatforms DESC,
    ReviewCount DESC,
    RecommendationPct DESC;

-- 12. What characteristics are most common among the top-reviewed games?
SELECT
    ca.GenreName,
    d.DeveloperType,
    CASE
        WHEN g.Price = 0 THEN 'Free'
        WHEN g.Price < 10 THEN 'Under $10'
        WHEN g.Price < 30 THEN '$10-$29.99'
        WHEN g.Price < 60 THEN '$30-$59.99'
        ELSE '$60+'
    END AS PriceRange,
    COUNT(DISTINCT g.GameID) AS NumTopGames,
    ROUND(AVG(gr.ReviewCount), 2) AS AvgReviews,
    ROUND(AVG(gr.RecommendationPct), 2) AS AvgRecommendationPct
FROM
    Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN DevelopedBy db ON g.GameID = db.GameID
    JOIN Developer d ON db.DeveloperName = d.DeveloperName
    JOIN (
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
    ) AS gr ON g.GameID = gr.GameID
WHERE
    g.GameID IN (
        SELECT
            t.GameID
        FROM
            (
                SELECT
                    GameID,
                    COUNT(*) AS ReviewCount
                FROM
                    Review
                GROUP BY
                    GameID
                ORDER BY
                    ReviewCount DESC
                LIMIT
                    50
            ) AS t
    )
GROUP BY
    ca.GenreName,
    d.DeveloperType,
    CASE
        WHEN g.Price = 0 THEN 'Free'
        WHEN g.Price < 10 THEN 'Under $10'
        WHEN g.Price < 30 THEN '$10-$29.99'
        WHEN g.Price < 60 THEN '$30-$59.99'
        ELSE '$60+'
    END
ORDER BY
    NumTopGames DESC,
    AvgRecommendationPct DESC;

-- 13. Which release months are associated with the highest average review counts and recommendation rates?
SELECT
    MONTH (g.ReleaseDate) AS ReleaseMonth,
    COUNT(DISTINCT g.GameID) AS NumGames,
    COUNT(r.ReviewID) AS NumReviews,
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
    AvgReviewsPerGame DESC,
    AvgRecommendationPct DESC;

-- 14. Which games released in the same year and genre show the largest differences in review count?
SELECT
    a.ReleaseYear,
    a.GenreName,
    a.Title AS MoreReviewedGame,
    b.Title AS LessReviewedGame,
    a.ReviewCount AS MoreReviewedCount,
    b.ReviewCount AS LessReviewedCount,
    (a.ReviewCount - b.ReviewCount) AS ReviewCountGap
FROM
    (
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
    ) AS a
    JOIN (
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
    ) AS b ON a.ReleaseYear = b.ReleaseYear
    AND a.GenreName = b.GenreName
    AND a.GameID < b.GameID
WHERE
    a.ReviewCount > b.ReviewCount
ORDER BY
    ReviewCountGap DESC,
    a.ReleaseYear,
    a.GenreName
LIMIT
    50;

-- 15. Which developers improved the most over time in recommendation rate and review count?
SELECT
    d.DeveloperName,
    d.DeveloperType,
    ROUND(
        AVG(
            CASE
                WHEN g.ReleaseDate = dev_bounds.FirstReleaseDate THEN stats.RecommendationPct
            END
        ),
        2
    ) AS FirstRecommendationPct,
    ROUND(
        AVG(
            CASE
                WHEN g.ReleaseDate = dev_bounds.LastReleaseDate THEN stats.RecommendationPct
            END
        ),
        2
    ) AS LastRecommendationPct,
    ROUND(
        AVG(
            CASE
                WHEN g.ReleaseDate = dev_bounds.LastReleaseDate THEN stats.RecommendationPct
            END
        ) - AVG(
            CASE
                WHEN g.ReleaseDate = dev_bounds.FirstReleaseDate THEN stats.RecommendationPct
            END
        ),
        2
    ) AS RecommendationImprovement,
    ROUND(
        AVG(
            CASE
                WHEN g.ReleaseDate = dev_bounds.FirstReleaseDate THEN stats.ReviewCount
            END
        ),
        2
    ) AS FirstReviewCount,
    ROUND(
        AVG(
            CASE
                WHEN g.ReleaseDate = dev_bounds.LastReleaseDate THEN stats.ReviewCount
            END
        ),
        2
    ) AS LastReviewCount,
    ROUND(
        AVG(
            CASE
                WHEN g.ReleaseDate = dev_bounds.LastReleaseDate THEN stats.ReviewCount
            END
        ) - AVG(
            CASE
                WHEN g.ReleaseDate = dev_bounds.FirstReleaseDate THEN stats.ReviewCount
            END
        ),
        2
    ) AS ReviewCountImprovement
FROM
    Developer d
    JOIN DevelopedBy db ON d.DeveloperName = db.DeveloperName
    JOIN Game g ON db.GameID = g.GameID
    JOIN (
        SELECT
            db2.DeveloperName,
            MIN(g2.ReleaseDate) AS FirstReleaseDate,
            MAX(g2.ReleaseDate) AS LastReleaseDate
        FROM
            DevelopedBy db2
            JOIN Game g2 ON db2.GameID = g2.GameID
        GROUP BY
            db2.DeveloperName
        HAVING
            MIN(g2.ReleaseDate) < MAX(g2.ReleaseDate)
    ) AS dev_bounds ON d.DeveloperName = dev_bounds.DeveloperName
    JOIN (
        SELECT
            g3.GameID,
            COUNT(r3.ReviewID) AS ReviewCount,
            AVG(
                CASE
                    WHEN r3.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM
            Game g3
            JOIN Review r3 ON g3.GameID = r3.GameID
        GROUP BY
            g3.GameID
    ) AS stats ON g.GameID = stats.GameID
GROUP BY
    d.DeveloperName,
    d.DeveloperType
ORDER BY
    RecommendationImprovement DESC,
    ReviewCountImprovement DESC;