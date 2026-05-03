-- Drop feature bridge first because it depends on both Game and Feature.
DROP TABLE HasFeatures;
-- Drop tag bridge before Tag and Game.
DROP TABLE TaggedWith;
-- Drop genre bridge before Genre and Game.
DROP TABLE ClassifiedAs;
-- Drop publisher bridge before Publisher and Game.
DROP TABLE PublishedBy;
-- Drop platform bridge before Platform and Game.
DROP TABLE Supports;
-- Drop developer bridge before Developer and Game.
DROP TABLE DevelopedBy;
-- Drop Review before Game because Review has a foreign key to Game.
DROP TABLE Review;
-- Drop Game after dependent fact and bridge tables are gone.
DROP TABLE Game;
-- Drop Feature after HasFeatures has been removed.
DROP TABLE Feature;
-- Drop Tag after TaggedWith has been removed.
DROP TABLE Tag;
-- Drop Genre after ClassifiedAs has been removed.
DROP TABLE Genre;
-- Drop Platform after Supports has been removed.
DROP TABLE Platform;
-- Drop Developer after DevelopedBy has been removed.
DROP TABLE Developer;
-- Drop Publisher after PublishedBy has been removed.
DROP TABLE Publisher;
