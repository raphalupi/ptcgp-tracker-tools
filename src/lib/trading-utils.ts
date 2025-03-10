import { CardSet, TradingData, TradingCards, Rarity, RARITIES } from './types';

// Helper functions
export function extractCardInfo(imageUrl: string): { setId: CardSet; cardId: string } | null {
  // Example URL: /sites/default/files/mythical_island/cards/32.webp
  const match = imageUrl.match(/\/files\/([^/]+)\/cards\/(\d+)\.webp$/);
  if (!match) return null;

  const [, setFolder, cardId] = match;
  const setMapping: Record<string, CardSet> = {
    'genetic_apex': 'A1',
    'mythical_island': 'A1a',
    'space_time_smackdown': 'A2',
    // 'triumphant_light': 'A2a', // Currently not available
  };

  const setId = setMapping[setFolder];
  return setId ? { setId, cardId } : null;
}

export async function getTradingData(): Promise<TradingData | null> {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      console.log('No active tab found');
      return null;
    }

    // Send message to get trading data
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id!, { action: 'getTradingData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Error getting trading data:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  } catch (error) {
    console.error('Error getting trading data:', error);
    return null;
  }
}

export function isOwnProfile(data: TradingData): boolean {
  return data.profile.user.uid === data.viewed_profile?.user.uid;
}

export function countCards(cards: TradingCards): { total: number; byRarity: Record<Rarity, number> } {
  const counts = {
    total: 0,
    byRarity: Object.keys(RARITIES).reduce((acc, rarity) => {
      acc[rarity as Rarity] = 0;
      return acc;
    }, {} as Record<Rarity, number>)
  };

  Object.entries(cards).forEach(([rarity, cardList]) => {
    if (rarity in RARITIES) {
      const count = cardList?.length || 0;
      counts.total += count;
      counts.byRarity[rarity as Rarity] = count;
    }
  });

  return counts;
} 