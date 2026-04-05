import type { RowDataPacket } from "mysql2/promise";

export interface CasinoRow extends RowDataPacket {
  CID: number;
  Name: string;
  Location: string;
  Phone: string | null;
  Capacity: number;
  Size: number;
  Manager: string;
}

export interface PlayerRow extends RowDataPacket {
  PID: number;
  Email: string;
  VIP: number | boolean;
  Points: number;
}

export interface GameRow extends RowDataPacket {
  GameID: number;
  Name: string;
  Category: string;
}

export interface OfferRow extends RowDataPacket {
  CID: number;
  GameID: number;
  MinBet: string | number;
  MaxBet: string | number;
  ActiveTables: number;
}

export interface VisitRow extends RowDataPacket {
  PID: number;
  CID: number;
  Date: string | Date;
}

export interface GameWithCasinosRow extends RowDataPacket {
  GameID: number;
  Name: string;
  Category: string;
  casino_names: string | null;
}
