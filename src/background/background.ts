type ColorArray = [number, number, number, number];

// Badge colors
const BADGE_COLORS: { [key: string]: ColorArray } = {
  gray: [128, 128, 128, 255],   // Not on profile page
  yellow: [240, 180, 0, 255],    // Stale data (>7 days)
  green: [0, 160, 0, 255],       // Fresh data
};

// Update badge based on URL and collection data
const updateBadge = async (tabId: number) => {
  try {
    // Get current tab URL
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';

    // Check if we're on a PTCGP profile page
    if (!url.includes('ptcgp-tracker.com')) {
      await chrome.action.setBadgeBackgroundColor({ 
        color: BADGE_COLORS.gray,
        tabId,
      });
      await chrome.action.setBadgeText({ 
        text: '•',
        tabId,
      });
      return;
    }

    // Get collection data from storage
    const { collection } = await chrome.storage.local.get('collection');
    if (!collection || !collection.lastUpdate) {
      await chrome.action.setBadgeBackgroundColor({ 
        color: BADGE_COLORS.yellow,
        tabId,
      });
      await chrome.action.setBadgeText({ 
        text: '•',
        tabId,
      });
      return;
    }

    // Check if data is older than 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const color = collection.lastUpdate < sevenDaysAgo ? BADGE_COLORS.yellow : BADGE_COLORS.green;

    await chrome.action.setBadgeBackgroundColor({ 
      color,
      tabId,
    });
    await chrome.action.setBadgeText({ 
      text: '•',
      tabId,
    });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
};

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    updateBadge(tabId);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadge(tabId);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.collection) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        updateBadge(tabs[0].id);
      }
    });
  }
}); 