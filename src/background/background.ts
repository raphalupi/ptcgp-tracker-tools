// Badge states
type BadgeState = 'none' | 'gray' | 'yellow' | 'green';

// Update badge based on current tab state
async function updateBadge(tabId: number, state: BadgeState) {
  if (state === 'none') {
    await chrome.action.setBadgeText({ text: '', tabId });
    return;
  }

  const colors = {
    gray: '#6B7280',
    yellow: '#EAB308',
    green: '#22C55E'
  };

  await chrome.action.setBadgeText({ text: '.', tabId });
  await chrome.action.setBadgeBackgroundColor({ color: colors[state], tabId });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'updateBadge' && sender.tab?.id) {
    updateBadge(sender.tab.id, message.state);
  }
  return true;
});

// Update badge when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (!tab.url.startsWith('https://ptcgp-tracker.com')) {
      updateBadge(tabId, 'none');
    }
  }
}); 