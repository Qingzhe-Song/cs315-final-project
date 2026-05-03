-- Publishers are stored once and referenced by PublishedBy to avoid duplicate publisher text.
CREATE TABLE Publisher (
    PublisherName VARCHAR(100),
    PRIMARY KEY (PublisherName)
);

-- Developers are stored once and connected to games through DevelopedBy.
CREATE TABLE Developer (
    DeveloperName VARCHAR(100),
    PRIMARY KEY (DeveloperName)
);

-- Platforms are normalized because one game can support several operating systems.
CREATE TABLE Platform (
    PlatformName VARCHAR(100),
    PRIMARY KEY (PlatformName)
);

-- Genres are normalized because each game can belong to multiple genre categories.
CREATE TABLE Genre (
    GenreName VARCHAR(100),
    PRIMARY KEY (GenreName)
);

-- Tags capture user-facing labels separately from formal genres.
CREATE TABLE Tag (
    TagName VARCHAR(100),
    PRIMARY KEY (TagName)
);

-- Features are stored separately so gameplay or support features can be shared across games.
CREATE TABLE Feature (
    FeatureName VARCHAR(100),
    PRIMARY KEY (FeatureName)
);

-- Game is the central entity; each row represents one released title.
CREATE TABLE Game (
    -- GameID comes from the source data and is used by every relationship table.
    GameID NUMERIC(20,0),
    -- Title, release date, and price are required for the analysis queries.
    Title VARCHAR(255) NOT NULL,
    ReleaseDate DATE NOT NULL,
    Price NUMERIC(8,2) NOT NULL,
    PRIMARY KEY (GameID)
);

-- Review records user sentiment and engagement for a single game.
CREATE TABLE Review (
    -- ReviewID uniquely identifies each review row from the source file.
    ReviewID NUMERIC(20,0),
    -- ReviewDate supports time-based review analysis if needed later.
    ReviewDate DATE NOT NULL,
    -- IsRecommended is the boolean source for recommendation percentages.
    IsRecommended BOOLEAN NOT NULL,
    -- HelpfulVotes and HoursPlayed measure engagement, so they may be nullable.
    HelpfulVotes INT,
    HoursPlayed NUMERIC(8,2),
    -- GameID is required because every review must belong to exactly one game.
    GameID NUMERIC(20,0) NOT NULL,
    PRIMARY KEY (ReviewID),
    FOREIGN KEY (GameID) REFERENCES Game(GameID)
);

-- A game can have multiple developers, and a developer can work on multiple games.
CREATE TABLE DevelopedBy (
    GameID NUMERIC(20,0),
    DeveloperName VARCHAR(100),
    -- Composite primary key prevents duplicate game-developer pairs.
    PRIMARY KEY (GameID, DeveloperName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (DeveloperName) REFERENCES Developer(DeveloperName)
);

-- A game can support multiple platforms, so platform support belongs in a bridge table.
CREATE TABLE Supports (
    GameID NUMERIC(20,0),
    PlatformName VARCHAR(100),
    -- Composite key keeps each game-platform relationship unique.
    PRIMARY KEY (GameID, PlatformName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (PlatformName) REFERENCES Platform(PlatformName)
);

-- Publishing is modeled separately because games can have multiple publishers.
CREATE TABLE PublishedBy (
    GameID NUMERIC(20,0),
    PublisherName VARCHAR(100),
    -- Composite key prevents loading the same publisher twice for a game.
    PRIMARY KEY (GameID, PublisherName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (PublisherName) REFERENCES Publisher(PublisherName)
);

-- Genres are many-to-many, so this table links games to their genre labels.
CREATE TABLE ClassifiedAs (
    GameID NUMERIC(20,0),
    GenreName VARCHAR(100),
    -- Composite key prevents duplicate genre assignments for the same game.
    PRIMARY KEY (GameID, GenreName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (GenreName) REFERENCES Genre(GenreName)
);

-- Tags are many-to-many and support tag-based engagement queries.
CREATE TABLE TaggedWith (
    GameID NUMERIC(20,0),
    TagName VARCHAR(100),
    -- Composite key keeps tag assignments unique per game.
    PRIMARY KEY (GameID, TagName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (TagName) REFERENCES Tag(TagName)
);

-- Features are many-to-many and support feature-level recommendation analysis.
CREATE TABLE HasFeatures (
    GameID NUMERIC(20,0),
    FeatureName VARCHAR(100),
    -- Composite key prevents duplicate feature rows for a game.
    PRIMARY KEY (GameID, FeatureName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (FeatureName) REFERENCES Feature(FeatureName)
);
