CREATE INDEX I_game_release_date_game
USING BTREE
ON Game (ReleaseDate, GameID);

CREATE INDEX I_game_price_game
USING BTREE
ON Game (Price, GameID);

CREATE INDEX I_review_game_analytics
USING BTREE
ON Review (GameID, IsRecommended, HelpfulVotes, HoursPlayed);

CREATE INDEX I_developedby_developer_game
USING BTREE
ON DevelopedBy (DeveloperName, GameID);

CREATE INDEX I_supports_platform_game
USING BTREE
ON Supports (PlatformName, GameID);

CREATE INDEX I_publishedby_publisher_game
USING BTREE
ON PublishedBy (PublisherName, GameID);

CREATE INDEX I_classifiedas_genre_game
USING BTREE
ON ClassifiedAs (GenreName, GameID);

CREATE INDEX I_taggedwith_tag_game
USING BTREE
ON TaggedWith (TagName, GameID);

CREATE INDEX I_hasfeatures_feature_game
USING BTREE
ON HasFeatures (FeatureName, GameID);