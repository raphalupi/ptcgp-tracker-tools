import "../styles/content.css";
import "../styles/trading.css";

// Trading data types
interface TradingUser {
  friend_id: string;
  game_name: string;
  uid: string;
  uuid: string;
}

interface TradingCards {
  [key: string]: string[] | undefined;
}

interface TradingProfile {
  tradable_cards: TradingCards;
  wanted_cards: TradingCards;
  user: TradingUser;
}

interface TradingData {
  profile: TradingProfile;
  viewed_profile?: TradingProfile;
}

interface TradingOpportunity {
  theirTradableIWant: Map<string, Set<string>>;
  myTradableTheyWant: Map<string, Set<string>>;
}

// Rarity mapping
const RARITY_TO_SYMBOL: Record<string, string> = {
  'diamond1': '♢',
  'diamond2': '♢♢',
  'diamond3': '♢♢♢',
  'diamond4': '♢♢♢♢',
  'star1': '☆'
};

const setIdToCodeMapping: Record<string, string> = {
  'A1': 'genetic_apex',
  'A1a': 'mythical_island',
  'A2': 'space_time_smackdown',
  // 'A2a': 'triumphant_light', // Currently not available
};

function getRaritySymbol(rarityCode: string): string {
  return RARITY_TO_SYMBOL[rarityCode] || rarityCode;
}

// Helper functions
function getTradingDataFromPage(): TradingData | null {
  try {
    const scriptElement = document.querySelector('script[data-drupal-selector="drupal-settings-json"]');
    if (!scriptElement?.textContent) {
      return null;
    }

    const data = JSON.parse(scriptElement.textContent);
    return data.ptcgp_trading || null;
  } catch {
    return null;
  }
}

function isOwnProfile(data: TradingData): boolean {
  return data.profile.user.uid === data.viewed_profile?.user.uid;
}

// Trading analysis functions
function analyzeTradingOpportunities(myProfile: TradingProfile, theirProfile: TradingProfile): TradingOpportunity {
  const opportunities: TradingOpportunity = {
    theirTradableIWant: new Map(),
    myTradableTheyWant: new Map()
  };

  // Find cards they have that I want
  Object.entries(myProfile.wanted_cards).forEach(([rarity, myWantedOfRarity]) => {
    if (!myWantedOfRarity) return;
    const theirTradableOfRarity = theirProfile.tradable_cards[rarity];
    if (theirTradableOfRarity) {
      const matches = myWantedOfRarity.filter(card => theirTradableOfRarity.includes(card));      
      if (matches.length > 0) {
        matches.forEach(card => {
          const [setId] = card.split(' ');
          if (!opportunities.theirTradableIWant.has(setId)) {
            opportunities.theirTradableIWant.set(setId, new Set());
          }
          opportunities.theirTradableIWant.get(setId)?.add(card);
        });
      }
    }
  });

  // Find cards I have that they want
  Object.entries(theirProfile.wanted_cards).forEach(([rarity, theirWantedOfRarity]) => {
    if (!theirWantedOfRarity) return;
    const myTradableOfRarity = myProfile.tradable_cards[rarity];
    if (myTradableOfRarity) {
      const matches = theirWantedOfRarity.filter(card => myTradableOfRarity.includes(card));      
      if (matches.length > 0) {
        matches.forEach(card => {
          const [setId] = card.split(' ');
          if (!opportunities.myTradableTheyWant.has(setId)) {
            opportunities.myTradableTheyWant.set(setId, new Set());
          }
          opportunities.myTradableTheyWant.get(setId)?.add(card);
        });
      }
    }
  });

  return opportunities;
}

function highlightMatchingCards(opportunities: TradingOpportunity): void {
  // Remove existing highlights
  const existingHighlights = document.querySelectorAll('.trading-match-they-have, .trading-match-you-have');
  existingHighlights.forEach(el => {
    el.classList.remove('trading-match-they-have', 'trading-match-you-have');
  });

  // Helper to highlight cards
  const highlightCards = (cardSet: Map<string, Set<string>>, className: string) => {
    cardSet.forEach((cards) => {
      cards.forEach(card => {
        const [cardSetId, cardId, rarityCode] = card.split(' ');
        const raritySymbol = getRaritySymbol(rarityCode);
        const cardSetCode = setIdToCodeMapping[cardSetId];
        
        // Find cards by rarity and image URL
        const cardElements = Array.from(document.querySelectorAll(`.card[data-rarity="${raritySymbol}"]`))
          .filter(el => {
            const imgElement = el.querySelector('img');
            if (!imgElement) {
              return false;
            }
            
            const imgSrc = imgElement.getAttribute('src');
            if (!imgSrc) {
              return false;
            }

            // Extract card ID from image URL
            const urlMatch = imgSrc.match(/\/files\/([^/]+)\/cards\/(\d+)\.webp$/);
            const matches = urlMatch && urlMatch[1] === cardSetCode && urlMatch[2] === cardId;
            return matches;
          });
        
        console.log(`## Card elements: ${cardElements}`);
        cardElements.forEach(el => {
          el.classList.add(className);
        });
      });
    });
  };

  // Apply new highlights
  highlightCards(opportunities.theirTradableIWant, 'trading-match-they-have');
  highlightCards(opportunities.myTradableTheyWant, 'trading-match-you-have');
}

// Main analysis function
function analyzeTradingPage(): void {
 
  const tradingData = getTradingDataFromPage();
  if (!tradingData || !tradingData.viewed_profile) {
    return;
  }

  if (isOwnProfile(tradingData)) {
    return;
  }

  const opportunities = analyzeTradingOpportunities(tradingData.profile, tradingData.viewed_profile);
  highlightMatchingCards(opportunities);

  console.log('Trading analysis complete:', {
    cardsTheyHaveThatIWant: Array.from(opportunities.theirTradableIWant.entries()).reduce((total, [, cards]) => total + cards.size, 0),
    cardsIHaveThatTheyWant: Array.from(opportunities.myTradableTheyWant.entries()).reduce((total, [, cards]) => total + cards.size, 0)
  });
}

// Initialize content script
console.log('PTCGP Tracker Tools content script loaded');

// Set up message listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'getTradingData') {
    const data = getTradingDataFromPage();
    sendResponse(data);
    return true;
  }

  sendResponse(null);
  return true;
});

// Run analysis when loaded
analyzeTradingPage(); 