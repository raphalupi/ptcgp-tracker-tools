// Card set mapping
export const CARD_SETS = {
  'A1': 'Genetic Apex',
  'A1a': 'Mystical Island',
  'A2': 'Space Time Smackdown',
  // 'A2a': 'Triumphant Light', // Currently not available for trading
} as const;

// Rarity types (matching JSON data)
export const RARITIES = {
  'diamond1': '♢',
  'diamond2': '♢♢',
  'diamond3': '♢♢♢',
  'diamond4': '♢♢♢♢',
  'star1': '☆',
} as const;

export type CardSet = keyof typeof CARD_SETS;
export type Rarity = keyof typeof RARITIES;

// Trading profile types
export interface TradingUser {
  friend_id: string;
  game_name: string;
  uid: string;
  uuid: string;
}

export interface TradingCards {
  [key: string]: string[] | undefined; // Array of "SET_ID CARD_ID RARITY"
}

export interface TradingProfile {
  tradable_cards: TradingCards;
  wanted_cards: TradingCards;
  user: TradingUser;
}

export interface TradingData {
  profile: TradingProfile;
  viewed_profile?: TradingProfile;
} 