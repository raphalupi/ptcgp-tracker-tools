import { Card, CollectionData } from '../types/types';

// Function to extract card information from a card element
export const extractCardInfo = (card: Element): Card | null => {
  const rarity = card.getAttribute('data-rarity');
  // Extract set ID and card ID from the image URL
  const imgSrc = card.querySelector('img')?.getAttribute('src');
  if (!imgSrc || !rarity) return null;

  const setMatch = imgSrc.match(/files\/([^/]+)\/cards/);
  const cardIdMatch = imgSrc.match(/cards\/(\d+)\.webp$/);
  
  if (!setMatch || !cardIdMatch) return null;

  return {
    id: cardIdMatch[1],
    rarity,
    setId: setMatch[1],
  };
};

// Function to extract collection data from the page
export const extractCollection = (): CollectionData => {
  const collection: CollectionData = {
    wanted: {},
    tradable: {},
    lastUpdate: Date.now(),
    userInfo: {
      // Extract from <p><b>In game name:</b> Name</p> format
      inGameName: document.evaluate('//p[contains(., "In game name:")]/text()', document, null, XPathResult.STRING_TYPE, null).stringValue.trim() || 'Unknown',
      // Extract from <p><b>Friend ID:</b> ID</p> format
      friendId: document.evaluate('//p[contains(., "Friend ID:")]/text()', document, null, XPathResult.STRING_TYPE, null).stringValue.trim() || 'Unknown',
    },
    stats: {
      wanted: { total: 0, byRarity: {} },
      tradable: { total: 0, byRarity: {} }
    }
  };

  // Helper function to process cards in a section
  const processSection = (section: Element | null, type: 'wanted' | 'tradable') => {
    if (!section) return;

    // Get all cards directly under the .cards div
    const cards = section.querySelector('.cards')?.querySelectorAll('.card');
    if (!cards) return;

    cards.forEach(cardElement => {
      const card = extractCardInfo(cardElement);
      if (card) {
        if (!collection[type][card.setId]) {
          collection[type][card.setId] = {};
        }
        if (!collection[type][card.setId][card.rarity]) {
          collection[type][card.setId][card.rarity] = [];
        }
        collection[type][card.setId][card.rarity].push(card.id);

        // Update stats
        collection.stats[type].total++;
        collection.stats[type].byRarity[card.rarity] = 
          (collection.stats[type].byRarity[card.rarity] || 0) + 1;
      }
    });
  };

  // Process both sections using the correct selectors from the HTML
  processSection(document.querySelector('.cards-wrapper .wanted'), 'wanted');
  processSection(document.querySelector('.cards-wrapper .tradable'), 'tradable');

  return collection;
};