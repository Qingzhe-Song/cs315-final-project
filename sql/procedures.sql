DROP PROCEDURE IF EXISTS sp_query_q1;
DROP PROCEDURE IF EXISTS sp_query_q2;
DROP PROCEDURE IF EXISTS sp_query_q3;
DROP PROCEDURE IF EXISTS sp_query_q4;
DROP PROCEDURE IF EXISTS sp_query_q5;
DROP PROCEDURE IF EXISTS sp_query_q6;
DROP PROCEDURE IF EXISTS sp_query_q7;
DROP PROCEDURE IF EXISTS sp_query_q8;
DROP PROCEDURE IF EXISTS sp_query_q9;
DROP PROCEDURE IF EXISTS sp_query_q10;
DROP PROCEDURE IF EXISTS sp_query_q11;
DROP PROCEDURE IF EXISTS sp_query_q12;
DROP PROCEDURE IF EXISTS sp_query_q13;
DROP PROCEDURE IF EXISTS sp_query_q14;
DROP PROCEDURE IF EXISTS sp_query_q15;

DELIMITER $$

CREATE PROCEDURE sp_query_q1(
    IN p_min_release_year INT,
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    SELECT
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
    WHERE g.ReleaseDate >= STR_TO_DATE(CONCAT(p_min_release_year, '-01-01'), '%Y-%m-%d')
    GROUP BY ca.GenreName
    HAVING COUNT(r.ReviewID) >= p_min_reviews
    ORDER BY AvgRecommendationPct DESC, NumReviews DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q2(
    IN p_min_reviews INT,
    IN p_min_recommendation_pct DOUBLE,
    IN p_limit_rows INT
)
BEGIN
    SELECT
        pb.PublisherName,
        COUNT(*) AS NumHighPerformingGames
    FROM (
        SELECT
            g.GameID
        FROM Game g
        JOIN Review r ON g.GameID = r.GameID
        GROUP BY g.GameID
        HAVING COUNT(r.ReviewID) >= p_min_reviews
           AND AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) >= (p_min_recommendation_pct / 100)
    ) AS high_perf
    JOIN PublishedBy pb ON high_perf.GameID = pb.GameID
    GROUP BY pb.PublisherName
    ORDER BY NumHighPerformingGames DESC, pb.PublisherName
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q3(
    IN p_limit_rows INT
)
BEGIN
    SELECT
        yearly.YearReleased,
        yearly.GenreName,
        ROUND(yearly.AvgReviewsPerGame, 2) AS AvgReviewsPerGame
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
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q4(
    IN p_limit_rows INT
)
BEGIN
    SELECT
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
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q5(
    IN p_min_genres INT,
    IN p_min_games INT,
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    SELECT
        db.DeveloperName,
        COUNT(DISTINCT ca.GenreName) AS NumGenres,
        COUNT(DISTINCT g.GameID) AS NumGames,
        COUNT(r.ReviewID) AS NumReviews,
        ROUND(
            AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
            2
        ) AS AvgRecommendationPct
    FROM DevelopedBy db
    JOIN Game g ON db.GameID = g.GameID
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN Review r ON g.GameID = r.GameID
    GROUP BY db.DeveloperName
    HAVING COUNT(DISTINCT ca.GenreName) >= p_min_genres
       AND COUNT(DISTINCT g.GameID) >= p_min_games
       AND COUNT(r.ReviewID) >= p_min_reviews
    ORDER BY AvgRecommendationPct DESC, NumGenres DESC, NumGames DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q6(
    IN p_limit_rows INT
)
BEGIN
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
            WHEN g.Price < 10 THEN 'Under $10'
            WHEN g.Price < 30 THEN '$10-$29.99'
            WHEN g.Price < 60 THEN '$30-$59.99'
            ELSE '$60+'
        END
    ORDER BY ca.GenreName, AvgReviewsPerGame DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q7(
    IN p_genre_keyword VARCHAR(50),
    IN p_limit_rows INT
)
BEGIN
    SELECT
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
    WHERE (p_genre_keyword = '' OR ca.GenreName LIKE CONCAT('%', p_genre_keyword, '%'))
    GROUP BY YEAR(g.ReleaseDate), ca.GenreName
    ORDER BY ca.GenreName, ReleaseYear
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q8(
    IN p_feature_keyword VARCHAR(50),
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    SELECT
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
    WHERE LOWER(hf.FeatureName) LIKE CONCAT('%', LOWER(p_feature_keyword), '%')
    GROUP BY tw.TagName
    HAVING COUNT(r.ReviewID) >= p_min_reviews
    ORDER BY AvgHelpfulVotes DESC, AvgHoursPlayed DESC, NumReviews DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q9(
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    SELECT
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
    HAVING COUNT(r.ReviewID) >= p_min_reviews
       AND AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) < 0.30
    ORDER BY MismatchScore DESC, ReviewCount DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q10(
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    SELECT
        pb.PublisherName,
        COUNT(DISTINCT g.GameID) AS NumPopularGames,
        ROUND(AVG(gr.ReviewCount), 2) AS AvgReviewsPerGame,
        ROUND(AVG(gr.RecommendationPct), 2) AS AvgRecommendationPct
    FROM Game g
    JOIN PublishedBy pb ON g.GameID = pb.GameID
    JOIN (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount,
            AVG(CASE WHEN IsRecommended THEN 1 ELSE 0 END) * 100 AS RecommendationPct
        FROM Review
        GROUP BY GameID
    ) AS gr ON g.GameID = gr.GameID
    WHERE gr.ReviewCount >= p_min_reviews
    GROUP BY pb.PublisherName
    HAVING COUNT(DISTINCT g.GameID) >= 5
    ORDER BY NumPopularGames DESC, AvgRecommendationPct DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q11(
    IN p_min_platforms INT,
    IN p_limit_rows INT
)
BEGIN
    SELECT
        g.Title,
        COUNT(DISTINCT s.PlatformName) AS NumPlatforms,
        COUNT(r.ReviewID) AS ReviewCount,
        ROUND(
            AVG(CASE WHEN r.IsRecommended THEN 1 ELSE 0 END) * 100,
            2
        ) AS RecommendationPct
    FROM Game g
    JOIN Supports s ON g.GameID = s.GameID
    LEFT JOIN Review r ON g.GameID = r.GameID
    GROUP BY g.GameID, g.Title
    HAVING COUNT(DISTINCT s.PlatformName) >= p_min_platforms
    ORDER BY NumPlatforms DESC, ReviewCount DESC, RecommendationPct DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q12(
    IN p_top_limit INT,
    IN p_limit_rows INT
)
BEGIN
    SELECT
        ca.GenreName,
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
            LIMIT p_top_limit
        ) AS t
    )
    GROUP BY
        ca.GenreName,
        CASE
            WHEN g.Price = 0 THEN 'Free'
            WHEN g.Price < 10 THEN 'Under $10'
            WHEN g.Price < 30 THEN '$10-$29.99'
            WHEN g.Price < 60 THEN '$30-$59.99'
            ELSE '$60+'
        END
    ORDER BY NumTopGames DESC, AvgRecommendationPct DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q13(
    IN p_limit_rows INT
)
BEGIN
    SELECT
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
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q14(
    IN p_limit_rows INT
)
BEGIN
    SELECT
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
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q15(
    IN p_limit_rows INT
)
BEGIN
    SELECT
        db.DeveloperName,
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
    FROM DevelopedBy db
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
    ) AS dev_bounds ON db.DeveloperName = dev_bounds.DeveloperName
    JOIN (
        SELECT
            g3.GameID,
            COUNT(r3.ReviewID) AS ReviewCount,
            AVG(CASE WHEN r3.IsRecommended THEN 1 ELSE 0 END) * 100 AS RecommendationPct
        FROM Game g3
        JOIN Review r3 ON g3.GameID = r3.GameID
        GROUP BY g3.GameID
    ) AS stats ON g.GameID = stats.GameID
    GROUP BY db.DeveloperName
    ORDER BY RecommendationImprovement DESC, ReviewCountImprovement DESC
    LIMIT p_limit_rows;
END $$

DELIMITER ;
