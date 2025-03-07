import { CollectionData } from '@/types/types';
import { extractCollection } from './collection-extractor';

interface TradingOpportunity {
  theirTradableIWant: Map<string, Set<string>>; // setId -> card ids
  myTradableTheyWant: Map<string, Set<string>>; // setId -> card ids
}

// Function to analyze trading opportunities
const analyzeTradingOpportunities = (myCollection: CollectionData, theirCollection: CollectionData): TradingOpportunity => {
  console.log('Analyzing trading opportunities...');
  console.log('My collection:', myCollection);
  console.log('Their collection:', theirCollection);

  const opportunities: TradingOpportunity = {
    theirTradableIWant: new Map(),
    myTradableTheyWant: new Map()
  };

  // Find cards they have that I want
  Object.entries(myCollection.wanted).forEach(([setId, myWantedInSet]) => {
    const theirTradableInSet = theirCollection.tradable[setId];
    if (theirTradableInSet) {
      Object.entries(myWantedInSet).forEach(([rarity, cardIds]) => {
        const theirTradableOfRarity = theirTradableInSet[rarity] || [];
        const matches = cardIds.filter(id => theirTradableOfRarity.includes(id));
        if (matches.length > 0) {
          console.log(`Found ${matches.length} cards they have that I want in set ${setId}, rarity ${rarity}`);
          if (!opportunities.theirTradableIWant.has(setId)) {
            opportunities.theirTradableIWant.set(setId, new Set());
          }
          matches.forEach(id => opportunities.theirTradableIWant.get(setId)?.add(id));
        }
      });
    }
  });

  // Find cards I have that they want
  Object.entries(theirCollection.wanted).forEach(([setId, theirWantedInSet]) => {
    const myTradableInSet = myCollection.tradable[setId];
    if (myTradableInSet) {
      Object.entries(theirWantedInSet).forEach(([rarity, cardIds]) => {
        const myTradableOfRarity = myTradableInSet[rarity] || [];
        const matches = cardIds.filter(id => myTradableOfRarity.includes(id));
        if (matches.length > 0) {
          console.log(`Found ${matches.length} cards I have that they want in set ${setId}, rarity ${rarity}`);
          if (!opportunities.myTradableTheyWant.has(setId)) {
            opportunities.myTradableTheyWant.set(setId, new Set());
          }
          matches.forEach(id => opportunities.myTradableTheyWant.get(setId)?.add(id));
        }
      });
    }
  });

  console.log('Trading opportunities:', opportunities);
  return opportunities;
};

// Function to highlight matching cards in the DOM
const highlightMatchingCards = (opportunities: TradingOpportunity) => {
  console.log('Highlighting matching cards...');
  
  // Add styles to the page
  const styleId = 'trading-highlight-styles';
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .card.trading-match-they-have {
        border: 2px solid gold !important;
        box-shadow: 0 0 5px gold !important;
        transition: all 0.2s ease-in-out;
      }
      .card.trading-match-you-have {
        border: 2px solid #4CAF50 !important;
        box-shadow: 0 0 5px #4CAF50 !important;
        transition: all 0.2s ease-in-out;
      }
    `;
    document.head.appendChild(style);
  }

  // Helper function to find a card by its ID in a section
  const findCardByIdInSection = (section: Element | null, cardId: string): Element | null => {
    if (!section) return null;
    const cards = section.querySelectorAll('.card');
    for (const card of cards) {
      const imgSrc = card.querySelector('img')?.getAttribute('src');
      if (imgSrc?.includes(`/cards/${cardId}.webp`)) {
        return card;
      }
    }
    return null;
  };

  // Highlight cards they have that I want
  opportunities.theirTradableIWant.forEach((cardIds, setId) => {
    console.log(`Looking for tradable cards in set ${setId}:`, Array.from(cardIds));
    const tradableSection = document.querySelector('.cards-wrapper .tradable .cards');
    
    cardIds.forEach(cardId => {
      const card = findCardByIdInSection(tradableSection, cardId);
      if (card) {
        console.log(`Found and highlighting card ${cardId}`);
        card.classList.add('trading-match-they-have');
      } else {
        console.warn(`Card ${cardId} not found in tradable section`);
      }
    });
  });

  // Highlight cards I have that they want
  opportunities.myTradableTheyWant.forEach((cardIds, setId) => {
    console.log(`Looking for wanted cards in set ${setId}:`, Array.from(cardIds));
    const wantedSection = document.querySelector('.cards-wrapper .wanted .cards');
    
    cardIds.forEach(cardId => {
      const card = findCardByIdInSection(wantedSection, cardId);
      if (card) {
        console.log(`Found and highlighting card ${cardId}`);
        card.classList.add('trading-match-you-have');
      } else {
        console.warn(`Card ${cardId} not found in wanted section`);
      }
    });
  });
};

// Main function to analyze trading opportunities
const analyzeTradingPage = async () => {
  console.log('Starting trading analysis...');
  
  // Wait for the page to be fully loaded
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get my collection from storage
  const { profileUrl, collection: myCollection } = await chrome.storage.local.get(['profileUrl', 'collection']);
  
  // If we don't have our collection data, we can't analyze
  if (!myCollection) {
    console.warn('No personal collection data found. Please set up your profile first.');
    return;
  }

  // If we're on our own profile page, don't analyze
  if (window.location.href === profileUrl) {
    console.log('On own profile page, skipping analysis');
    return;
  }

  console.log('Current URL:', window.location.href);
  console.log('Profile URL:', profileUrl);

  // Extract the current page's collection
  const theirCollection = extractCollection();

  // Analyze trading opportunities
  const opportunities = analyzeTradingOpportunities(myCollection, theirCollection);

  // Highlight matching cards
  highlightMatchingCards(opportunities);

  // Log results for debugging
  console.log('Trading analysis complete:', {
    cardsTheyHaveThatIWant: Array.from(opportunities.theirTradableIWant.entries()).reduce((total, [, cards]) => total + cards.size, 0),
    cardsIHaveThatTheyWant: Array.from(opportunities.myTradableTheyWant.entries()).reduce((total, [, cards]) => total + cards.size, 0)
  });
};

// Run the analysis when the page loads
console.log('Trading analyzer script loaded');
analyzeTradingPage();