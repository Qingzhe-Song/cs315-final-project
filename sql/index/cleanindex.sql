-- Remove the release-date index before rerunning index creation or baseline tests.
DROP INDEX I_game_release_date_game ON Game;
-- Remove the price index used by price bucket queries.
DROP INDEX I_game_price_game ON Game;
-- Remove the review analytics index used by recommendation and engagement queries.
DROP INDEX I_review_game_analytics ON Review;
-- Remove the developer bridge index.
DROP INDEX I_developedby_developer_game ON DevelopedBy;
-- Remove the platform bridge index.
DROP INDEX I_supports_platform_game ON Supports;
-- Remove the publisher bridge index.
DROP INDEX I_publishedby_publisher_game ON PublishedBy;
-- Remove the genre bridge index.
DROP INDEX I_classifiedas_genre_game ON ClassifiedAs;
-- Remove the tag bridge index.
DROP INDEX I_taggedwith_tag_game ON TaggedWith;
-- Remove the feature bridge index.
DROP INDEX I_hasfeatures_feature_game ON HasFeatures;
