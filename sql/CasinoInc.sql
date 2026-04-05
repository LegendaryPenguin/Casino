-- CasinoInc.sql — MySQL 8+ schema and seed data for Casino Explorer
-- Import after creating database (e.g. defaultdb on Aiven)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS PLAYS;
DROP TABLE IF EXISTS VISITS;
DROP TABLE IF EXISTS OFFERS;
DROP TABLE IF EXISTS GAMES;
DROP TABLE IF EXISTS PLAYER;
DROP TABLE IF EXISTS CASINO;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE CASINO (
  CID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  Location VARCHAR(255) NOT NULL,
  Phone VARCHAR(64) DEFAULT NULL,
  Capacity INT NOT NULL,
  Size INT NOT NULL,
  Manager VARCHAR(255) NOT NULL,
  PRIMARY KEY (CID),
  KEY idx_casino_location (Location),
  KEY idx_casino_manager (Manager)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PLAYER (
  PID INT NOT NULL AUTO_INCREMENT,
  Email VARCHAR(255) NOT NULL,
  VIP TINYINT(1) NOT NULL DEFAULT 0,
  Points INT NOT NULL DEFAULT 0,
  PRIMARY KEY (PID),
  UNIQUE KEY uq_player_email (Email),
  KEY idx_player_vip (VIP),
  KEY idx_player_points (Points)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE GAMES (
  GameID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  Category VARCHAR(100) NOT NULL,
  PRIMARY KEY (GameID),
  KEY idx_games_category (Category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE OFFERS (
  CID INT NOT NULL,
  GameID INT NOT NULL,
  MinBet DECIMAL(12,2) NOT NULL,
  MaxBet DECIMAL(12,2) NOT NULL,
  ActiveTables INT NOT NULL DEFAULT 0,
  PRIMARY KEY (CID, GameID),
  CONSTRAINT fk_offers_casino FOREIGN KEY (CID) REFERENCES CASINO (CID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_offers_game FOREIGN KEY (GameID) REFERENCES GAMES (GameID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE VISITS (
  PID INT NOT NULL,
  CID INT NOT NULL,
  Date DATE NOT NULL,
  PRIMARY KEY (PID, CID, Date),
  CONSTRAINT fk_visits_player FOREIGN KEY (PID) REFERENCES PLAYER (PID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_visits_casino FOREIGN KEY (CID) REFERENCES CASINO (CID) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_visits_date (Date),
  KEY idx_visits_casino (CID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE PLAYS (
  PID INT NOT NULL,
  GameID INT NOT NULL,
  PRIMARY KEY (PID, GameID),
  CONSTRAINT fk_plays_player FOREIGN KEY (PID) REFERENCES PLAYER (PID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_plays_game FOREIGN KEY (GameID) REFERENCES GAMES (GameID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Casinos
INSERT INTO CASINO (Name, Location, Phone, Capacity, Size, Manager) VALUES
('Emerald Royale', 'Las Vegas', '+1-702-555-0101', 1200, 45000, 'Jordan Blake'),
('Lucky Schmuck''s Parlor', 'Reno', '+1-775-555-0142', 420, 12000, 'Morgan Ellis'),
('Midnight Spire', 'Atlantic City', '+1-609-555-0199', 890, 32000, 'Riley Chen'),
('Velvet Compass', 'Monte Carlo', '+377-555-0200', 600, 28000, 'Sofia Laurent'),
('Obsidian Deck', 'Macau', '+853-555-0303', 2000, 62000, 'Wei Zhang'),
('Harbor Lights Casino', 'Singapore', '+65-555-0404', 1500, 50000, 'Priya Nair');

-- Players
INSERT INTO PLAYER (Email, VIP, Points) VALUES
('alex.kim@example.com', 1, 12400),
('blake.rowe@example.com', 0, 2100),
('casey.mendez@example.com', 1, 8900),
('dana.cho@example.com', 0, 450),
('evan.stone@example.com', 0, 3300),
('faye.irwin@example.com', 1, 15200),
('gus.patel@example.com', 0, 780),
('helen.voss@example.com', 1, 20100),
('ivan.ortiz@example.com', 0, 5600),
('jules.bauer@example.com', 0, 1200);

-- Games (Category: Card Game | Table Game | Specialty)
INSERT INTO GAMES (Name, Category) VALUES
('Blackjack', 'Card Game'),
('Baccarat', 'Card Game'),
('Texas Hold''em', 'Card Game'),
('European Roulette', 'Table Game'),
('American Roulette', 'Table Game'),
('Craps', 'Table Game'),
('Three Card Poker', 'Card Game'),
('Wheel of Fortune', 'Specialty'),
('Slots — Diamond Run', 'Specialty');

-- Offers (which casino offers which game)
INSERT INTO OFFERS (CID, GameID, MinBet, MaxBet, ActiveTables) VALUES
(1, 1, 25.00, 5000.00, 18),
(1, 4, 10.00, 2000.00, 12),
(1, 9, 1.00, 500.00, 240),
(2, 1, 15.00, 2500.00, 8),
(2, 3, 50.00, 10000.00, 6),
(2, 9, 0.50, 200.00, 80),
(3, 2, 100.00, 15000.00, 10),
(3, 5, 10.00, 3000.00, 14),
(3, 6, 5.00, 2000.00, 6),
(4, 1, 20.00, 4000.00, 10),
(4, 4, 25.00, 5000.00, 8),
(4, 7, 10.00, 1500.00, 5),
(5, 1, 50.00, 25000.00, 40),
(5, 2, 200.00, 50000.00, 22),
(5, 5, 15.00, 8000.00, 20),
(5, 9, 2.00, 2000.00, 400),
(6, 3, 100.00, 20000.00, 14),
(6, 6, 10.00, 5000.00, 8),
(6, 8, 5.00, 1000.00, 4);

-- Visits
INSERT INTO VISITS (PID, CID, Date) VALUES
(1, 1, '2025-11-02'),
(1, 5, '2025-12-18'),
(2, 2, '2025-10-14'),
(3, 1, '2025-09-20'),
(3, 3, '2025-11-30'),
(4, 2, '2025-08-05'),
(5, 4, '2025-12-01'),
(5, 1, '2026-01-10'),
(6, 5, '2025-07-22'),
(6, 6, '2026-01-15'),
(7, 3, '2025-11-11'),
(8, 5, '2025-10-03'),
(8, 1, '2026-02-01'),
(9, 4, '2025-12-24'),
(10, 2, '2025-09-09'),
(1, 3, '2026-02-14'),
(2, 1, '2026-02-20'),
(4, 5, '2026-03-01'),
(9, 5, '2026-03-02'),
(7, 1, '2026-03-03');

-- Plays (player played game at least once)
INSERT INTO PLAYS (PID, GameID) VALUES
(1, 1), (1, 4), (2, 1), (2, 9), (3, 3), (3, 1),
(4, 9), (5, 4), (5, 1), (6, 2), (6, 5), (7, 6),
(8, 1), (8, 2), (9, 7), (10, 1), (1, 2), (8, 9);
