-- Supports release-date filters and keeps GameID in the index for immediate joins.
CREATE INDEX I_game_release_date_game
USING BTREE
ON Game (ReleaseDate, GameID);

-- Supports price-range bucketing queries and joins the matching games by GameID.
CREATE INDEX I_game_price_game
USING BTREE
ON Game (Price, GameID);

-- Review queries group by GameID and aggregate recommendation and engagement columns.
CREATE INDEX I_review_game_analytics
USING BTREE
ON Review (GameID, IsRecommended, HelpfulVotes, HoursPlayed);

-- Speeds developer-based grouping before joining back to games.
CREATE INDEX I_developedby_developer_game
USING BTREE
ON DevelopedBy (DeveloperName, GameID);

-- Speeds platform filters and counts before joining back to games.
CREATE INDEX I_supports_platform_game
USING BTREE
ON Supports (PlatformName, GameID);

-- Speeds publisher leaderboards that group by publisher name.
CREATE INDEX I_publishedby_publisher_game
USING BTREE
ON PublishedBy (PublisherName, GameID);

-- Speeds genre trend and genre comparison queries.
CREATE INDEX I_classifiedas_genre_game
USING BTREE
ON ClassifiedAs (GenreName, GameID);

-- Speeds tag engagement queries that start from tag names.
CREATE INDEX I_taggedwith_tag_game
USING BTREE
ON TaggedWith (TagName, GameID);

-- Speeds feature filtering and feature-level summary queries.
CREATE INDEX I_hasfeatures_feature_game
USING BTREE
ON HasFeatures (FeatureName, GameID);
