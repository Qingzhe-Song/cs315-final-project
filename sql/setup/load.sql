-- Load publishers first because PublishedBy references this lookup table.
LOAD DATA LOCAL INFILE 'clean/Publisher.csv'
INTO TABLE Publisher
-- CSV values are comma separated and quoted fields may contain commas.
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
-- Clean CSV files use Windows line endings.
LINES TERMINATED BY '\r\n'
-- Skip the header row from the exported CSV.
IGNORE 1 LINES
(PublisherName);

-- Load developers before DevelopedBy rows reference developer names.
LOAD DATA LOCAL INFILE 'clean/Developer.csv'
INTO TABLE Developer
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(DeveloperName);

-- Load platforms before Supports rows reference platform names.
LOAD DATA LOCAL INFILE 'clean/Platform.csv'
INTO TABLE Platform
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(PlatformName);

-- Load genres before ClassifiedAs rows reference genre names.
LOAD DATA LOCAL INFILE 'clean/Genre.csv'
INTO TABLE Genre
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(GenreName);

-- Load tags before TaggedWith rows reference tag names.
LOAD DATA LOCAL INFILE 'clean/Tag.csv'
INTO TABLE Tag
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(TagName);

-- Load features before HasFeatures rows reference feature names.
LOAD DATA LOCAL INFILE 'clean/Feature.csv'
INTO TABLE Feature
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(FeatureName);

-- Load games before reviews and bridge rows because they all reference GameID.
LOAD DATA LOCAL INFILE 'clean/Game.csv'
INTO TABLE Game
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
-- Store the raw date text in @ReleaseDate so it can be converted in SET.
(GameID, Title, @ReleaseDate, Price)
-- Convert ISO date text into a DATE column during import.
SET ReleaseDate = STR_TO_DATE(@ReleaseDate, '%Y-%m-%d');

-- Load reviews after games so the GameID foreign key can be checked.
LOAD DATA LOCAL INFILE 'clean/Review.csv'
INTO TABLE Review
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
-- Use variables for fields that need conversion or blank handling.
(ReviewID, @ReviewDate, IsRecommended, HelpfulVotes, @HoursPlayed, GameID)
-- Convert review dates and store blank playtime values as NULL instead of empty strings.
SET ReviewDate = STR_TO_DATE(@ReviewDate, '%Y-%m-%d'),
    HoursPlayed = NULLIF(@HoursPlayed, '');

-- Load game-developer links after Game and Developer are populated.
LOAD DATA LOCAL INFILE 'clean/DevelopedBy.csv'
INTO TABLE DevelopedBy
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(GameID, DeveloperName);

-- Load game-platform links after Game and Platform are populated.
LOAD DATA LOCAL INFILE 'clean/Supports.csv'
INTO TABLE Supports
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(GameID, PlatformName);

-- Load game-publisher links after Game and Publisher are populated.
LOAD DATA LOCAL INFILE 'clean/PublishedBy.csv'
INTO TABLE PublishedBy
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(GameID, PublisherName);

-- Load game-genre links after Game and Genre are populated.
LOAD DATA LOCAL INFILE 'clean/ClassifiedAs.csv'
INTO TABLE ClassifiedAs
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(GameID, GenreName);

-- Load game-tag links after Game and Tag are populated.
LOAD DATA LOCAL INFILE 'clean/TaggedWith.csv'
INTO TABLE TaggedWith
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(GameID, TagName);

-- Load game-feature links after Game and Feature are populated.
LOAD DATA LOCAL INFILE 'clean/HasFeatures.csv'
INTO TABLE HasFeatures
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(GameID, FeatureName);
