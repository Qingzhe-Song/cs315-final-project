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
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100,
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
    WITH high_perf AS (
        SELECT
            g.GameID
        FROM Game g
        JOIN Review r ON g.GameID = r.GameID
        GROUP BY g.GameID
        HAVING COUNT(r.ReviewID) >= p_min_reviews
           AND AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
           ) >= (p_min_recommendation_pct / 100)
    )
    SELECT
        pb.PublisherName,
        COUNT(*) AS NumHighPerformingGames
    FROM high_perf hp
    JOIN PublishedBy pb ON hp.GameID = pb.GameID
    GROUP BY pb.PublisherName
    ORDER BY NumHighPerformingGames DESC, pb.PublisherName
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q3(
    IN p_limit_rows INT
)
BEGIN
    WITH review_counts AS (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount
        FROM Review
        GROUP BY GameID
    ),
    yearly AS (
        SELECT
            YEAR(g.ReleaseDate) AS YearReleased,
            ca.GenreName,
            AVG(rc.ReviewCount) AS AvgReviewsPerGame
        FROM Game g
        JOIN ClassifiedAs ca ON g.GameID = ca.GameID
        JOIN review_counts rc ON g.GameID = rc.GameID
        GROUP BY YEAR(g.ReleaseDate), ca.GenreName
    ),
    best AS (
        SELECT
            YearReleased,
            MAX(AvgReviewsPerGame) AS MaxAvgReviewsPerGame
        FROM yearly
        GROUP BY YearReleased
    )
    SELECT
        y.YearReleased,
        y.GenreName,
        ROUND(y.AvgReviewsPerGame, 2) AS AvgReviewsPerGame
    FROM yearly y
    JOIN best b
        ON y.YearReleased = b.YearReleased
       AND y.AvgReviewsPerGame = b.MaxAvgReviewsPerGame
    ORDER BY y.YearReleased
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q4(
    IN p_limit_rows INT
)
BEGIN
    WITH per_game AS (
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
        FROM Game g
        JOIN Review r ON g.GameID = r.GameID
        GROUP BY g.GameID, g.Title, g.ReleaseDate
    ),
    year_averages AS (
        SELECT
            YEAR(ReleaseDate) AS ReleaseYear,
            AVG(ReviewCount) AS AvgYearReviewCount,
            AVG(RecommendationPct) AS AvgYearRecommendationPct
        FROM per_game
        GROUP BY YEAR(ReleaseDate)
    )
    SELECT
        pg.Title,
        YEAR(pg.ReleaseDate) AS ReleaseYear,
        pg.ReviewCount,
        ROUND(pg.RecommendationPct, 2) AS RecommendationPct,
        ROUND(ya.AvgYearReviewCount, 2) AS AvgYearReviewCount,
        ROUND(ya.AvgYearRecommendationPct, 2) AS AvgYearRecommendationPct
    FROM per_game pg
    JOIN year_averages ya ON YEAR(pg.ReleaseDate) = ya.ReleaseYear
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
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100,
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
    WITH game_review_stats AS (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount,
            AVG(
                CASE
                    WHEN IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM Review
        GROUP BY GameID
    ),
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
        FROM Game
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
    FROM priced_games pg
    JOIN ClassifiedAs ca ON pg.GameID = ca.GameID
    JOIN game_review_stats grs ON pg.GameID = grs.GameID
    GROUP BY ca.GenreName, pg.PriceRange
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
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100,
            2
        ) AS AvgRecommendationPct
    FROM Game g
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    LEFT JOIN Review r ON g.GameID = r.GameID
    WHERE p_genre_keyword = ''
       OR ca.GenreName LIKE CONCAT('%', p_genre_keyword, '%')
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
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100,
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
    FROM Game g
    JOIN Review r ON g.GameID = r.GameID
    GROUP BY g.GameID, g.Title
    HAVING COUNT(r.ReviewID) >= p_min_reviews
       AND AVG(
            CASE
                WHEN r.IsRecommended THEN 1
                ELSE 0
            END
       ) < 0.30
    ORDER BY MismatchScore DESC, ReviewCount DESC
    LIMIT p_limit_rows;
END $$

CREATE PROCEDURE sp_query_q10(
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    WITH game_review_stats AS (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount,
            AVG(
                CASE
                    WHEN IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM Review
        GROUP BY GameID
    )
    SELECT
        pb.PublisherName,
        COUNT(DISTINCT g.GameID) AS NumPopularGames,
        ROUND(AVG(grs.ReviewCount), 2) AS AvgReviewsPerGame,
        ROUND(AVG(grs.RecommendationPct), 2) AS AvgRecommendationPct
    FROM Game g
    JOIN PublishedBy pb ON g.GameID = pb.GameID
    JOIN game_review_stats grs ON g.GameID = grs.GameID
    WHERE grs.ReviewCount >= p_min_reviews
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
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100,
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
    WITH game_review_stats AS (
        SELECT
            GameID,
            COUNT(*) AS ReviewCount,
            AVG(
                CASE
                    WHEN IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM Review
        GROUP BY GameID
    ),
    top_games AS (
        SELECT
            GameID
        FROM game_review_stats
        ORDER BY ReviewCount DESC
        LIMIT p_top_limit
    ),
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
        FROM Game
    )
    SELECT
        ca.GenreName,
        pg.PriceRange,
        COUNT(DISTINCT g.GameID) AS NumTopGames,
        ROUND(AVG(grs.ReviewCount), 2) AS AvgReviews,
        ROUND(AVG(grs.RecommendationPct), 2) AS AvgRecommendationPct
    FROM Game g
    JOIN top_games tg ON g.GameID = tg.GameID
    JOIN ClassifiedAs ca ON g.GameID = ca.GameID
    JOIN game_review_stats grs ON g.GameID = grs.GameID
    JOIN priced_games pg ON g.GameID = pg.GameID
    GROUP BY ca.GenreName, pg.PriceRange
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
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100,
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
    WITH game_review_counts AS (
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
    )
    SELECT
        a.ReleaseYear,
        a.GenreName,
        a.Title AS MoreReviewedGame,
        b.Title AS LessReviewedGame,
        a.ReviewCount AS MoreReviewedCount,
        b.ReviewCount AS LessReviewedCount,
        (a.ReviewCount - b.ReviewCount) AS ReviewCountGap
    FROM game_review_counts a
    JOIN game_review_counts b
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
    WITH game_stats AS (
        SELECT
            g.GameID,
            COUNT(r.ReviewID) AS ReviewCount,
            AVG(
                CASE
                    WHEN r.IsRecommended THEN 1
                    ELSE 0
                END
            ) * 100 AS RecommendationPct
        FROM Game g
        JOIN Review r ON g.GameID = r.GameID
        GROUP BY g.GameID
    )
    SELECT
        hf.FeatureName,
        COUNT(DISTINCT gs.GameID) AS NumGames,
        ROUND(AVG(gs.ReviewCount), 2) AS AvgReviewCount,
        ROUND(AVG(gs.RecommendationPct), 2) AS AvgRecommendationPct
    FROM game_stats gs
    JOIN HasFeatures hf ON gs.GameID = hf.GameID
    GROUP BY hf.FeatureName
    HAVING COUNT(DISTINCT gs.GameID) >= 5
    ORDER BY AvgRecommendationPct DESC, AvgReviewCount DESC, NumGames DESC
    LIMIT p_limit_rows;
END $$

DELIMITER ;
