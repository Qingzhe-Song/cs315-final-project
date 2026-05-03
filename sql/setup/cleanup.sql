-- drop dependent review and bridge tables before the lookup tables they reference.
DROP TABLE HasFeatures;
DROP TABLE TaggedWith;
DROP TABLE ClassifiedAs;
DROP TABLE PublishedBy;
DROP TABLE Supports;
DROP TABLE DevelopedBy;
DROP TABLE Review;
DROP TABLE Game;

-- drop lookup tables after all foreign-key dependents are gone.
DROP TABLE Feature;
DROP TABLE Tag;
DROP TABLE Genre;
DROP TABLE Platform;
DROP TABLE Developer;
DROP TABLE Publisher;
