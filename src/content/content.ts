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

interface TradingSettings {
  showTradeOverlay: boolean;
  showMatchedOnly: boolean;
  rarityToggles: {
    [key: string]: boolean;
  };
  collectionToggles: {
    [key: string]: boolean;
  };
}

const DEFAULT_SETTINGS: TradingSettings = {
  showTradeOverlay: true,
  showMatchedOnly: false,
  rarityToggles: {
    'diamond1': true,
    'diamond2': true,
    'diamond3': true,
    'diamond4': true,
    'star1': true,
    // 'star2': true, // Currently not available
    // 'star3': true, // Currently not available
    // 'crown1': true // Currently not available
  },
  collectionToggles: {
    'A1': true,
    'A1a': true,
    'A2': true,
    // 'A2a': false, // Currently not available
  }
};

// Storage functions
async function loadTradingSettings(): Promise<TradingSettings> {
  try {
    console.log('Loading trading settings...');
    const result = await chrome.storage.local.get('tradingSettings');
    console.log('Loaded settings from storage:', result);
    
    if (!result.tradingSettings) {
      console.log('No settings found, using defaults');
      // Save default settings to storage
      await chrome.storage.local.set({ tradingSettings: DEFAULT_SETTINGS });
      return DEFAULT_SETTINGS;
    }
    
    return result.tradingSettings;
  } catch (error) {
    console.error('Error loading trading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

async function saveTradingSettings(settings: Partial<TradingSettings>): Promise<void> {
  try {
    console.log('Saving trading settings:', settings);
    const currentSettings = await loadTradingSettings();
    const newSettings = {
      ...currentSettings,
      ...settings,
    };
    console.log('New settings to save:', newSettings);
    await chrome.storage.local.set({ tradingSettings: newSettings });
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving trading settings:', error);
  }
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

// Extract trading data from the page
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

// Check if the viewed profile is the own profile
function isOwnProfile(data: TradingData): boolean {
  return data.profile.user.uid === data.viewed_profile?.user.uid;
}

// Analyze trading opportunities between two profiles
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

// Function to set collection data attributes on cards
function setCollectionAttributes(): void {
  document.querySelectorAll('.card').forEach(el => {
    const imgElement = el.querySelector('img');
    if (imgElement) {
      const imgSrc = imgElement.getAttribute('src');
      if (imgSrc) {
        const urlMatch = imgSrc.match(/\/files\/([^/]+)\/cards\/(\d+)\.webp$/);
        if (urlMatch) {
          const collectionCode = Object.entries(setIdToCodeMapping).find(([, code]) => code === urlMatch[1])?.[0];
          if (collectionCode) {
            el.setAttribute('data-collection', collectionCode);
          }
        }
      }
    }
  });
}

// Highlight matching cards on screen
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

// Function to check if we're on a proper trading profile page
function isTradingProfilePage(): boolean {
  const url = window.location.href;
  return url.startsWith('https://ptcgp-tracker.com/u/') && url.length > 'https://ptcgp-tracker.com/u/'.length;
}

// Function to apply settings to the page
async function applySettingsToPage(): Promise<void> {
  // Only apply settings on trading profile pages
  if (!isTradingProfilePage()) {
    console.log('Not a trading profile page, skipping settings application');
    return;
  }

  // Set collection attributes on all cards
  setCollectionAttributes();

  const settings = await loadTradingSettings();
  console.log('Applying settings to page:', settings);

  // Apply trade overlay setting
  if (settings.showTradeOverlay) {
    document.body.classList.add('show-trade-overlay');
  } else {
    document.body.classList.remove('show-trade-overlay');
  }

  // Check if we're on our own profile
  const tradingData = getTradingDataFromPage();
  console.log('Trading data from page:', tradingData);
  
  // If we can't get trading data, assume we're on our own profile
  const isOwnProfilePage = !tradingData || isOwnProfile(tradingData);
  console.log('Is own profile page:', isOwnProfilePage);

  // Only apply matched cards only setting if we're not on our own profile
  if (!isOwnProfilePage) {
    console.log('Applying matched cards only setting for other profile');
    if (settings.showMatchedOnly) {
      document.body.classList.add('show-matched-only');
    } else {
      document.body.classList.remove('show-matched-only');
    }
  } else {
    // Always remove the class on own profile
    console.log('Removing matched cards only class for own profile');
    document.body.classList.remove('show-matched-only');
  }

  // Apply rarity visibility settings
  Object.entries(settings.rarityToggles).forEach(([rarityCode, isVisible]) => {
    const hideClass = `hide-rarity-${rarityCode}`;
    if (isVisible) {
      document.body.classList.remove(hideClass);
    } else {
      document.body.classList.add(hideClass);
    }
  });

  // Apply collection visibility settings
  Object.entries(settings.collectionToggles).forEach(([collectionCode, isVisible]) => {
    const hideClass = `hide-collection-${collectionCode}`;
    if (isVisible) {
      document.body.classList.remove(hideClass);
    } else {
      document.body.classList.add(hideClass);
    }
  });
}

// Main analysis function
async function analyzeTradingPage(): Promise<void> {
  console.log('Starting trading page analysis...');
  const settings = await loadTradingSettings();
  console.log('Current settings:', settings);
 
  const tradingData = getTradingDataFromPage();
  if (!tradingData || !tradingData.viewed_profile) {
    console.log('No trading data found, skipping analysis');
    return;
  }

  if (isOwnProfile(tradingData)) {
    console.log('Cannot analyze own profile');
    return;
  }

  const opportunities = analyzeTradingOpportunities(tradingData.profile, tradingData.viewed_profile);
  
  // Always apply the classes for matching cards
  highlightMatchingCards(opportunities);

  // Apply settings to the page
  await applySettingsToPage();

  console.log('Trading analysis complete:', {
    cardsTheyHaveThatIWant: Array.from(opportunities.theirTradableIWant.entries()).reduce((total, [, cards]) => total + cards.size, 0),
    cardsIHaveThatTheyWant: Array.from(opportunities.myTradableTheyWant.entries()).reduce((total, [, cards]) => total + cards.size, 0)
  });
}

// Function to determine badge state
function getBadgeState(): 'none' | 'gray' | 'yellow' | 'green' {
  // If not on the website, badge will be hidden by background script
  if (!window.location.href.startsWith('https://ptcgp-tracker.com')) {
    return 'none';
  }

  const tradingData = getTradingDataFromPage();
  const isTradingProfile = isTradingProfilePage();

  if (isTradingProfile) {
    if (!tradingData) {
      return 'gray'; // No trading data available
    } else if (isOwnProfile(tradingData)) {
      return 'yellow'; // Own profile
    } else {
      return 'green'; // Viewing someone else's profile
    }
  } else {
    return 'gray'; // Other pages on the site
  }
}

// Function to update badge state
function updateBadgeState() {
  const state = getBadgeState();
  console.log('Updating badge state:', { state });
  chrome.runtime.sendMessage({
    action: 'updateBadge',
    state
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

  if (message.action === 'updateTradingSettings') {
    saveTradingSettings(message.settings)
      .then(() => {
        // Apply the new settings immediately
        applySettingsToPage();
        sendResponse(true);
      })
      .catch(() => sendResponse(false));
    return true;
  }

  if (message.action === 'getTradingSettings') {
    loadTradingSettings()
      .then(settings => sendResponse(settings))
      .catch(() => sendResponse(DEFAULT_SETTINGS));
    return true;
  }

  if (message.action === 'getBadgeState') {
    const state = getBadgeState();
    sendResponse({ state });
    return true;
  }

  sendResponse(null);
  return true;
});

// Run analysis and apply settings when loaded
console.log('Starting initial analysis and applying settings...');
Promise.all([
  analyzeTradingPage(),
  applySettingsToPage()
]).then(() => {
  // Update badge state after analysis is complete
  updateBadgeState();
}).catch(error => {
  console.error('Error during initialization:', error);
  // Update badge state even if there's an error
  updateBadgeState();
}); 