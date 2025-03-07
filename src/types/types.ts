export interface UserInfo {
  inGameName: string;
  friendId: string;
}

export interface Stats {
  total: number;
  byRarity: { [key: string]: number };
}

export interface CollectionStats {
  wanted: Stats;
  tradable: Stats;
}

export interface Card {
  id: string;
  name?: string;
  rarity: string;
  setId: string;
}

export interface SetData {
  [rarity: string]: string[]; // Array of card IDs
}

export interface CollectionData {
  wanted: { [setId: string]: SetData };
  tradable: { [setId: string]: SetData };
  lastUpdate: number;
  userInfo: UserInfo;
  stats: CollectionStats;
}

export interface StorageData {
  profileUrl: string;
  collection?: CollectionData;
  settings: {
    showIndicators: boolean;
    showStats: boolean;
    rarityFilters: {
      [key: string]: boolean;
    };
  };
}

export interface ScrapeMessage {
  action: 'scrape';
}

export interface ScrapeResponse {
  collection?: CollectionData;
  error?: string;
} 
