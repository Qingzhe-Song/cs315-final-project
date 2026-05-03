DELIMITER $$

-- Parameterized version of Q1: ranks genres released after a chosen year with a minimum review count.
CREATE PROCEDURE sp_query_q1(
    IN p_min_release_year INT,
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    -- Convert the minimum release year into a January 1 date and rank qualifying genres.
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
    -- p_min_release_year controls the lower release-date boundary.
    WHERE g.ReleaseDate >= STR_TO_DATE(CONCAT(p_min_release_year, '-01-01'), '%Y-%m-%d')
    GROUP BY ca.GenreName
    -- p_min_reviews removes genres with too little review evidence.
    HAVING COUNT(r.ReviewID) >= p_min_reviews
    ORDER BY AvgRecommendationPct DESC, NumReviews DESC
    -- p_limit_rows keeps procedure output manageable for reports or demos.
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q2: finds publishers with games meeting review-volume and recommendation thresholds.
CREATE PROCEDURE sp_query_q2(
    IN p_min_reviews INT,
    IN p_min_recommendation_pct DOUBLE,
    IN p_limit_rows INT
)
BEGIN
    -- First isolate games that meet both popularity and recommendation thresholds.
    WITH high_perf AS (
        SELECT
            g.GameID
        FROM Game g
        JOIN Review r ON g.GameID = r.GameID
        GROUP BY g.GameID
        -- Recommendation input is a percent, so divide by 100 before comparing to AVG.
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
    -- Count publishers only for games that survived the high_perf filter.
    JOIN PublishedBy pb ON hp.GameID = pb.GameID
    GROUP BY pb.PublisherName
    ORDER BY NumHighPerformingGames DESC, pb.PublisherName
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q3: returns each release year's genre with the highest average reviews per game.
CREATE PROCEDURE sp_query_q3(
    IN p_limit_rows INT
)
BEGIN
    WITH review_counts AS (
        -- Count reviews per game once so year/genre averages are based on game-level rows.
        SELECT
            GameID,
            COUNT(*) AS ReviewCount
        FROM Review
        GROUP BY GameID
    ),
    yearly AS (
        -- Average game review counts within each release-year and genre group.
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
        -- Capture the highest average review count for each release year.
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
        -- Join back to keep the genre or genres tied for the yearly maximum.
        ON y.YearReleased = b.YearReleased
       AND y.AvgReviewsPerGame = b.MaxAvgReviewsPerGame
    ORDER BY y.YearReleased
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q4: finds games that are more reviewed but less recommended than their release-year peers.
CREATE PROCEDURE sp_query_q4(
    IN p_limit_rows INT
)
BEGIN
    WITH per_game AS (
        -- Build per-game review count and recommendation percentage.
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
        -- Compute release-year baselines for review count and sentiment.
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
    -- Keep games above their year's review average but below its recommendation average.
    WHERE pg.ReviewCount > ya.AvgYearReviewCount
      AND pg.RecommendationPct < ya.AvgYearRecommendationPct
    ORDER BY pg.ReviewCount DESC, pg.RecommendationPct ASC
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q5: ranks developers after enforcing minimum genre, game, and review coverage.
CREATE PROCEDURE sp_query_q5(
    IN p_min_genres INT,
    IN p_min_games INT,
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    -- Aggregate at developer level across related games, genres, and reviews.
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
    -- Parameters control how broad and well-reviewed a developer's catalog must be.
    HAVING COUNT(DISTINCT ca.GenreName) >= p_min_genres
       AND COUNT(DISTINCT g.GameID) >= p_min_games
       AND COUNT(r.ReviewID) >= p_min_reviews
    ORDER BY AvgRecommendationPct DESC, NumGenres DESC, NumGames DESC
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q6: compares review activity across price ranges within each genre.
CREATE PROCEDURE sp_query_q6(
    IN p_limit_rows INT
)
BEGIN
    WITH game_review_stats AS (
        -- Summarize each game's popularity and recommendation percentage.
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
        -- Turn numeric prices into comparable buckets for grouping.
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
    -- Compare each price bucket within each genre.
    GROUP BY ca.GenreName, pg.PriceRange
    ORDER BY ca.GenreName, AvgReviewsPerGame DESC
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q7: optionally filters genres by keyword while preserving yearly trend output.
CREATE PROCEDURE sp_query_q7(
    IN p_genre_keyword VARCHAR(50),
    IN p_limit_rows INT
)
BEGIN
    -- Empty p_genre_keyword means "all genres"; otherwise use a partial name match.
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
    -- LEFT JOIN keeps release counts even for games without reviews.
    LEFT JOIN Review r ON g.GameID = r.GameID
    WHERE p_genre_keyword = ''
       OR ca.GenreName LIKE CONCAT('%', p_genre_keyword, '%')
    GROUP BY YEAR(g.ReleaseDate), ca.GenreName
    ORDER BY ca.GenreName, ReleaseYear
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q8: ranks tags for games whose features match the supplied keyword.
CREATE PROCEDURE sp_query_q8(
    IN p_feature_keyword VARCHAR(50),
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    -- Match features by keyword, then summarize tag engagement for the matching games.
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
    -- LOWER makes the feature search case-insensitive.
    WHERE LOWER(hf.FeatureName) LIKE CONCAT('%', LOWER(p_feature_keyword), '%')
    GROUP BY tw.TagName
    -- p_min_reviews keeps low-sample tags out of the ranking.
    HAVING COUNT(r.ReviewID) >= p_min_reviews
    ORDER BY AvgHelpfulVotes DESC, AvgHoursPlayed DESC, NumReviews DESC
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q9: scores popular but poorly recommended games by review-volume sentiment mismatch.
CREATE PROCEDURE sp_query_q9(
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    -- Score games where high review volume contrasts with low recommendation sentiment.
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
    -- p_min_reviews controls popularity; the 30% sentiment ceiling defines poor recommendation.
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

-- Parameterized version of Q10: counts publishers' popular games using a configurable review threshold.
CREATE PROCEDURE sp_query_q10(
    IN p_min_reviews INT,
    IN p_limit_rows INT
)
BEGIN
    WITH game_review_stats AS (
        -- Build game-level popularity and sentiment before grouping by publisher.
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
    -- p_min_reviews defines which games count as popular.
    WHERE grs.ReviewCount >= p_min_reviews
    GROUP BY pb.PublisherName
    -- Keep publishers with at least five popular games for a catalog-level view.
    HAVING COUNT(DISTINCT g.GameID) >= 5
    ORDER BY NumPopularGames DESC, AvgRecommendationPct DESC
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q11: compares games that support at least the requested number of platforms.
CREATE PROCEDURE sp_query_q11(
    IN p_min_platforms INT,
    IN p_limit_rows INT
)
BEGIN
    -- Count platform support and review activity for each game.
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
    -- LEFT JOIN preserves games with platform support but no reviews.
    LEFT JOIN Review r ON g.GameID = r.GameID
    GROUP BY g.GameID, g.Title
    -- p_min_platforms chooses how broad platform support must be.
    HAVING COUNT(DISTINCT s.PlatformName) >= p_min_platforms
    ORDER BY NumPlatforms DESC, ReviewCount DESC, RecommendationPct DESC
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q12: summarizes genre and price traits among the top reviewed games.
CREATE PROCEDURE sp_query_q12(
    IN p_top_limit INT,
    IN p_limit_rows INT
)
BEGIN
    WITH game_review_stats AS (
        -- Compute review totals and sentiment for each game.
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
        -- p_top_limit chooses how many of the most-reviewed games to analyze.
        SELECT
            GameID
        FROM game_review_stats
        ORDER BY ReviewCount DESC
        LIMIT p_top_limit
    ),
    priced_games AS (
        -- Bucket prices so the result can summarize common pricing bands.
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
    -- Count top games for each genre and price-range combination.
    GROUP BY ca.GenreName, pg.PriceRange
    ORDER BY NumTopGames DESC, AvgRecommendationPct DESC
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q13: ranks release months by review density and recommendation percentage.
CREATE PROCEDURE sp_query_q13(
    IN p_limit_rows INT
)
BEGIN
    -- Group by calendar month to compare release timing across all years.
    SELECT
        MONTH(g.ReleaseDate) AS ReleaseMonth,
        COUNT(DISTINCT g.GameID) AS NumGames,
        COUNT(r.ReviewID) AS NumReviews,
        -- Normalize review volume by number of games released in that month.
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

-- Parameterized version of Q14: compares review-count gaps between games sharing release year and genre.
CREATE PROCEDURE sp_query_q14(
    IN p_limit_rows INT
)
BEGIN
    WITH game_review_counts AS (
        -- Create comparable game review counts within each release-year and genre group.
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
        -- Pair games from the same year and genre; GameID order prevents duplicate reverse pairs.
        ON a.ReleaseYear = b.ReleaseYear
       AND a.GenreName = b.GenreName
       AND a.GameID < b.GameID
    -- Keep only pairs where a has the larger review count.
    WHERE a.ReviewCount > b.ReviewCount
    ORDER BY ReviewCountGap DESC, a.ReleaseYear, a.GenreName
    LIMIT p_limit_rows;
END $$

-- Parameterized version of Q15: averages per-game review statistics across each feature.
CREATE PROCEDURE sp_query_q15(
    IN p_limit_rows INT
)
BEGIN
    WITH game_stats AS (
        -- Calculate game-level review count and recommendation percentage first.
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
    -- Attach each game statistic to all features supported by that game.
    JOIN HasFeatures hf ON gs.GameID = hf.GameID
    GROUP BY hf.FeatureName
    -- Require five games so feature averages are not based on tiny samples.
    HAVING COUNT(DISTINCT gs.GameID) >= 5
    ORDER BY AvgRecommendationPct DESC, AvgReviewCount DESC, NumGames DESC
    LIMIT p_limit_rows;
END $$

DELIMITER ;
