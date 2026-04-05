-- CasinoInc.sql — your canonical schema + seed (Aiven / MySQL 8+)
-- Import into your database (e.g. defaultdb). Replaces all rows in these tables.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS PLAYS;
DROP TABLE IF EXISTS VISITS;
DROP TABLE IF EXISTS OFFERS;
DROP TABLE IF EXISTS PLAYER;
DROP TABLE IF EXISTS GAMES;
DROP TABLE IF EXISTS CASINO;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- MAIN TABLES
-- =========================

CREATE TABLE CASINO (
    CID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(100),
    Phone VARCHAR(20),
    Capacity INT,
    Size INT,
    Manager VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PLAYER (
    PID INT PRIMARY KEY,
    Email VARCHAR(100) UNIQUE NOT NULL,
    VIP BOOLEAN,
    Points INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE GAMES (
    GameID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Category VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- RELATIONSHIP TABLES
-- =========================

CREATE TABLE OFFERS (
    CID INT,
    GameID INT,
    MinBet DECIMAL(10,2),
    MaxBet DECIMAL(10,2),
    ActiveTables INT,
    PRIMARY KEY (CID, GameID),
    FOREIGN KEY (CID) REFERENCES CASINO(CID),
    FOREIGN KEY (GameID) REFERENCES GAMES(GameID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE VISITS (
    PID INT,
    CID INT,
    Date DATE,
    PRIMARY KEY (PID, CID, Date),
    FOREIGN KEY (PID) REFERENCES PLAYER(PID),
    FOREIGN KEY (CID) REFERENCES CASINO(CID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PLAYS (
    PID INT,
    GameID INT,
    PRIMARY KEY (PID, GameID),
    FOREIGN KEY (PID) REFERENCES PLAYER(PID),
    FOREIGN KEY (GameID) REFERENCES GAMES(GameID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- DATA INSERTS (ASCII apostrophes doubled for SQL strings)
-- =========================

INSERT INTO CASINO (CID, Name, Location, Phone, Capacity, Size, Manager) VALUES
(1, 'Lucky Schmuck''s', 'Chip City', '913-325-5672', 5000, 100000, 'John Casino, Esq.'),
(2, 'Mozart''s Playhouse', 'Topeka', '785-430-7180', 3000, 70000, 'Owen Deines'),
(3, 'The Blockspace Church', 'Denver', '913-850-9123', 2000, 50000, 'Akshay Kumar');

INSERT INTO GAMES (GameID, Name, Category) VALUES
(101, 'Blackjack', 'Card'),
(102, 'Poker', 'Card'),
(103, 'Roulette', 'Table'),
(104, 'Craps', 'Table'),
(105, 'Baccarat', 'Table'),
(106, 'Slots', 'Machine');

INSERT INTO PLAYER (PID, Email, VIP, Points) VALUES
(1001, 'john@example.com', TRUE, 1500),
(1002, 'emma@example.com', FALSE, 300),
(1003, 'liam@example.com', TRUE, 2200),
(1004, 'olivia@example.com', FALSE, 120);

INSERT INTO OFFERS (CID, GameID, MinBet, MaxBet, ActiveTables) VALUES
(1, 101, 10.00, 500.00, 20),
(1, 102, 25.00, 1000.00, 15),
(1, 106, 1.00, 100.00, 60),
(2, 101, 5.00, 300.00, 10),
(2, 103, 10.00, 500.00, 8),
(2, 104, 15.00, 600.00, 6),
(3, 102, 20.00, 800.00, 12),
(3, 105, 50.00, 2000.00, 5),
(3, 106, 0.50, 50.00, 40);

INSERT INTO VISITS (PID, CID, Date) VALUES
(1001, 1, '2026-01-10'),
(1001, 2, '2026-01-15'),
(1002, 1, '2026-02-01'),
(1002, 3, '2026-02-12'),
(1003, 3, '2026-02-10'),
(1003, 1, '2026-02-18'),
(1004, 2, '2026-03-05');

INSERT INTO PLAYS (PID, GameID) VALUES
(1001, 101),
(1001, 102),
(1002, 106),
(1002, 104),
(1003, 102),
(1003, 105),
(1004, 101),
(1004, 103);
