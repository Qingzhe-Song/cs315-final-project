-- drop analysis indexes before rerunning index creation or baseline tests.
DROP INDEX I_game_release_date_game ON Game;
DROP INDEX I_game_price_game ON Game;
DROP INDEX I_review_game_analytics ON Review;
DROP INDEX I_developedby_developer_game ON DevelopedBy;
DROP INDEX I_supports_platform_game ON Supports;
DROP INDEX I_publishedby_publisher_game ON PublishedBy;
DROP INDEX I_classifiedas_genre_game ON ClassifiedAs;
DROP INDEX I_taggedwith_tag_game ON TaggedWith;
DROP INDEX I_hasfeatures_feature_game ON HasFeatures;
