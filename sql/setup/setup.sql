-- lookup tables hold repeated names once so bridge tables can reference them.
CREATE TABLE Publisher (
    PublisherName VARCHAR(100),
    PRIMARY KEY (PublisherName)
);

CREATE TABLE Developer (
    DeveloperName VARCHAR(100),
    PRIMARY KEY (DeveloperName)
);

CREATE TABLE Platform (
    PlatformName VARCHAR(100),
    PRIMARY KEY (PlatformName)
);

CREATE TABLE Genre (
    GenreName VARCHAR(100),
    PRIMARY KEY (GenreName)
);

CREATE TABLE Tag (
    TagName VARCHAR(100),
    PRIMARY KEY (TagName)
);

CREATE TABLE Feature (
    FeatureName VARCHAR(100),
    PRIMARY KEY (FeatureName)
);

-- game is the central entity referenced by reviews and all bridge tables.
CREATE TABLE Game (
    GameID NUMERIC(20,0),
    Title VARCHAR(255) NOT NULL,
    ReleaseDate DATE NOT NULL,
    Price NUMERIC(8,2) NOT NULL,
    PRIMARY KEY (GameID)
);

-- review stores sentiment and engagement for exactly one game.
CREATE TABLE Review (
    ReviewID NUMERIC(20,0),
    ReviewDate DATE NOT NULL,
    IsRecommended BOOLEAN NOT NULL,
    HelpfulVotes INT,
    HoursPlayed NUMERIC(8,2),
    GameID NUMERIC(20,0) NOT NULL,
    PRIMARY KEY (ReviewID),
    FOREIGN KEY (GameID) REFERENCES Game(GameID)
);

-- bridge tables model many-to-many relationships and prevent duplicate pairs.
CREATE TABLE DevelopedBy (
    GameID NUMERIC(20,0),
    DeveloperName VARCHAR(100),
    PRIMARY KEY (GameID, DeveloperName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (DeveloperName) REFERENCES Developer(DeveloperName)
);

CREATE TABLE Supports (
    GameID NUMERIC(20,0),
    PlatformName VARCHAR(100),
    PRIMARY KEY (GameID, PlatformName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (PlatformName) REFERENCES Platform(PlatformName)
);

CREATE TABLE PublishedBy (
    GameID NUMERIC(20,0),
    PublisherName VARCHAR(100),
    PRIMARY KEY (GameID, PublisherName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (PublisherName) REFERENCES Publisher(PublisherName)
);

CREATE TABLE ClassifiedAs (
    GameID NUMERIC(20,0),
    GenreName VARCHAR(100),
    PRIMARY KEY (GameID, GenreName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (GenreName) REFERENCES Genre(GenreName)
);

CREATE TABLE TaggedWith (
    GameID NUMERIC(20,0),
    TagName VARCHAR(100),
    PRIMARY KEY (GameID, TagName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (TagName) REFERENCES Tag(TagName)
);

CREATE TABLE HasFeatures (
    GameID NUMERIC(20,0),
    FeatureName VARCHAR(100),
    PRIMARY KEY (GameID, FeatureName),
    FOREIGN KEY (GameID) REFERENCES Game(GameID),
    FOREIGN KEY (FeatureName) REFERENCES Feature(FeatureName)
);
