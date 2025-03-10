import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertCircleIcon, CogIcon, RotateCcwIcon } from 'lucide-react';

const RARITY_TO_SYMBOL: Record<string, string> = {
  'diamond1': '♢',
  'diamond2': '♢♢',
  'diamond3': '♢♢♢',
  'diamond4': '♢♢♢♢',
  'star1': '☆'
};

const COLLECTION_TO_NAME: Record<string, string> = {
  'A1': 'Genetic Apex',
  'A1a': 'Mythical Island',
  'A2': 'Space Time Smackdown',
  // 'A2a': 'Triumphant Light', // Currently not available
};

function getRaritySymbol(rarityCode: string): string {
  return RARITY_TO_SYMBOL[rarityCode] || rarityCode;
}

const RARITIES = {
  'diamond1': 'Common',
  'diamond2': 'Uncommon',
  'diamond3': 'Rare',
  'diamond4': 'Ultra Rare',
  'star1': 'Special',
} as const;

type RarityToggles = {
  [K in keyof typeof RARITIES]: boolean;
};

type CollectionToggles = {
  [K in keyof typeof COLLECTION_TO_NAME]: boolean;
};

const DEFAULT_SETTINGS = {
  showTradeOverlay: true,
  showMatchedOnly: false,
  rarityToggles: Object.keys(RARITIES).reduce((acc, rarity) => ({
    ...acc,
    [rarity]: true
  }), {} as RarityToggles),
  collectionToggles: Object.keys(COLLECTION_TO_NAME).reduce((acc, collection) => ({
    ...acc,
    [collection]: true
  }), {} as CollectionToggles)
};

export const TradingSettings = () => {
  const [rarityToggles, setRarityToggles] = useState<RarityToggles>(() => {
    // Initialize all rarities to true (visible)
    return Object.keys(RARITIES).reduce((acc, rarity) => ({
      ...acc,
      [rarity]: true
    }), {} as RarityToggles);
  });

  const [collectionToggles, setCollectionToggles] = useState<CollectionToggles>(() => {
    // Initialize all collections to true (visible)
    return Object.keys(COLLECTION_TO_NAME).reduce((acc, collection) => ({
      ...acc,
      [collection]: true
    }), {} as CollectionToggles);
  });

  const [showTradeOverlay, setShowTradeOverlay] = useState(true);
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);
  const [badgeState, setBadgeState] = useState<'none' | 'gray' | 'yellow' | 'green'>('none');

  // Load settings on mount
  useEffect(() => {
    chrome.storage.local.get('tradingSettings', (result) => {
      if (result.tradingSettings) {
        setShowTradeOverlay(result.tradingSettings.showTradeOverlay);
        setShowMatchedOnly(result.tradingSettings.showMatchedOnly);
        if (result.tradingSettings.rarityToggles) {
          setRarityToggles(result.tradingSettings.rarityToggles);
        }
        if (result.tradingSettings.collectionToggles) {
          setCollectionToggles(result.tradingSettings.collectionToggles);
        }
      }
    });
  }, []);

  // Get current tab's badge state
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getBadgeState' }, (response) => {
          if (response?.state) {
            setBadgeState(response.state);
          }
        });
      }
    });
  }, []);

  // Save settings when they change
  useEffect(() => {
    const settings = {
      showTradeOverlay,
      showMatchedOnly,
      rarityToggles,
      collectionToggles
    };

    // Save to storage
    chrome.storage.local.set({ tradingSettings: settings });

    // Send message to content script to apply settings
    chrome.tabs.query({ url: 'https://ptcgp-tracker.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateTradingSettings',
            settings
          }).catch(console.error);
        }
      });
    });
  }, [showTradeOverlay, showMatchedOnly, rarityToggles, collectionToggles]);

  const handleToggleChange = (rarity: keyof typeof RARITIES) => {
    setRarityToggles(prev => ({
      ...prev,
      [rarity]: !prev[rarity]
    }));
  };

  const handleCollectionToggleChange = (collection: keyof typeof COLLECTION_TO_NAME) => {
    setCollectionToggles(prev => ({
      ...prev,
      [collection]: !prev[collection]
    }));
  };

  const handleResetSettings = () => {
    setShowTradeOverlay(DEFAULT_SETTINGS.showTradeOverlay);
    setShowMatchedOnly(DEFAULT_SETTINGS.showMatchedOnly);
    setRarityToggles(DEFAULT_SETTINGS.rarityToggles);
    setCollectionToggles(DEFAULT_SETTINGS.collectionToggles);
  };

  return (
    <AccordionItem value="trading" className="border-none text-sm">
      <AccordionTrigger className="py-2">
        <div className="flex items-center gap-2">
          <CogIcon className="h-4 w-4 text-gray-500" />
          <span>Trading Settings</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 mt-2">
          {/* Warning Messages */}
          {badgeState === 'gray' && (
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <AlertCircleIcon className="h-3 w-3" /> Filters only apply to trading profiles.
            </span>
          )}

          {/* Trade Overlay Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="trade-overlay" className="text-xs font-medium">
              Show Trade Matches
            </Label>
            <Switch
              id="trade-overlay"
              checked={showTradeOverlay}
              onCheckedChange={setShowTradeOverlay}
            />
          </div>

          {/* Matched Cards Only Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="matched-only" className="text-xs font-medium">
              Show Matched Cards Only
            </Label>
            <Switch
              id="matched-only"
              checked={showMatchedOnly}
              onCheckedChange={setShowMatchedOnly}
            />
          </div>

          {/* Rarity Toggles */}
          <div className="space-y-3">
            <p className="text-xs font-medium">Show/Hide Rarities:</p>
            <div className="grid grid-cols-5 gap-2 pl-2">
              {Object.entries(RARITIES).map(([rarityCode, label]) => (
                <div key={rarityCode} className="flex flex-col items-center gap-1.5">
                  <Label 
                    htmlFor={`rarity-${rarityCode}`} 
                    className="text-xs cursor-pointer"
                    title={label}
                  >
                    <span className="font-mono text-base">{getRaritySymbol(rarityCode)}</span>
                  </Label>
                  <Switch
                    id={`rarity-${rarityCode}`}
                    checked={rarityToggles[rarityCode as keyof typeof RARITIES]}
                    onCheckedChange={() => handleToggleChange(rarityCode as keyof typeof RARITIES)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Collection Toggles */}
          <div className="space-y-3">
            <p className="text-xs font-medium">Show/Hide Collections:</p>
            <div className="space-y-2 pl-2">
              {Object.entries(COLLECTION_TO_NAME).map(([collectionCode, name]) => (
                <div key={collectionCode} className="flex items-center justify-between">
                  <Label 
                    htmlFor={`collection-${collectionCode}`} 
                    className="text-xs cursor-pointer"
                    title={name}
                  >
                    {name}
                  </Label>
                  <Switch
                    id={`collection-${collectionCode}`}
                    checked={collectionToggles[collectionCode as keyof typeof COLLECTION_TO_NAME]}
                    onCheckedChange={() => handleCollectionToggleChange(collectionCode as keyof typeof COLLECTION_TO_NAME)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end">
            <button
              onClick={handleResetSettings}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              title="Reset to default settings"
            >
              <RotateCcwIcon className="h-3 w-3" />
              Reset Settings
            </button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}; 