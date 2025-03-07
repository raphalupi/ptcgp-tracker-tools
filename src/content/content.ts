import { ScrapeMessage } from '../types/types';
import { extractCollection } from './collection-extractor';

console.log('PTCGP Tracker Tools content script loaded');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message: ScrapeMessage, _sender, sendResponse) => {
  if (message.action === 'scrape') {
    try {
      const collection = extractCollection();
      sendResponse({ collection });
    } catch (error) {
      console.error('Error extracting collection:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  return true;
}); 