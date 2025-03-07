import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CogIcon } from 'lucide-react';

const RARITIES = {
  '♢': 'Common',
  '♢♢': 'Uncommon',
  '♢♢♢': 'Rare',
  '♢♢♢♢': 'Ultra Rare',
  '☆': 'Special',
} as const;

type RarityToggles = {
  [K in keyof typeof RARITIES]: boolean;
};

export const TradingSettings = () => {
  const [rarityToggles, setRarityToggles] = useState<RarityToggles>(() => {
    // Initialize all rarities to true (visible)
    return Object.keys(RARITIES).reduce((acc, rarity) => ({
      ...acc,
      [rarity]: true
    }), {} as RarityToggles);
  });

  const [showTradeOverlay, setShowTradeOverlay] = useState(true);
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);

  // Update CSS classes on the body when toggles change
  useEffect(() => {
    // Get all tabs and update them
    chrome.tabs.query({ url: 'https://ptcgp-tracker.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          // Inject CSS if not already injected
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            css: `
              /* Hide cards of specific rarity when body has the corresponding attribute */
              ${Object.keys(RARITIES).map(rarity => `
                body[data-hide-rarity] .card[data-rarity="${rarity}"] {
                  display: var(--${rarity}-display, block) !important;
                }
              `).join('\n')}

              /* Hide trade overlay when disabled */
              body[data-hide-trade-overlay] .card.trading-match-they-have,
              body[data-hide-trade-overlay] .card.trading-match-you-have {
                border: none !important;
                box-shadow: none !important;
              }

              /* Hide non-matched cards when show-matched-only is enabled */
              body[data-show-matched-only] .card:not(.trading-match-they-have):not(.trading-match-you-have) {
                display: none !important;
              }
            `
          }).catch(console.error);

          // Execute script to update body attributes
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (toggles: RarityToggles, hideOverlay: boolean, matchedOnly: boolean) => {
              const hiddenRarities = Object.entries(toggles)
                .filter(([, isVisible]) => !isVisible)
                .map(([rarity]) => rarity);

              // Set CSS variables for each rarity
              Object.keys(toggles).forEach(rarity => {
                document.documentElement.style.setProperty(
                  `--${rarity}-display`,
                  hiddenRarities.includes(rarity) ? 'none' : 'block'
                );
              });

              // Keep track of hidden rarities in data attribute for debugging
              if (hiddenRarities.length > 0) {
                document.body.setAttribute('data-hide-rarity', hiddenRarities.join(','));
              } else {
                document.body.removeAttribute('data-hide-rarity');
              }

              // Toggle trade overlay visibility
              if (hideOverlay) {
                document.body.setAttribute('data-hide-trade-overlay', '');
              } else {
                document.body.removeAttribute('data-hide-trade-overlay');
              }

              // Toggle matched-only display
              if (matchedOnly) {
                document.body.setAttribute('data-show-matched-only', '');
              } else {
                document.body.removeAttribute('data-show-matched-only');
              }
            },
            args: [rarityToggles, !showTradeOverlay, showMatchedOnly]
          }).catch(console.error);
        }
      });
    });
  }, [rarityToggles, showTradeOverlay, showMatchedOnly]);

  const handleToggleChange = (rarity: keyof typeof RARITIES) => {
    setRarityToggles(prev => ({
      ...prev,
      [rarity]: !prev[rarity]
    }));
  };

  return (
    <AccordionItem value="trading" className="border-none">
      <AccordionTrigger className="py-2">
        <div className="flex items-center gap-2">
          <CogIcon className="h-4 w-4 text-gray-500" />
          <span>Trading Settings</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          {/* Trade Overlay Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="trade-overlay" className="text-sm font-medium">
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
            <Label htmlFor="matched-only" className="text-sm font-medium">
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
            <p className="text-sm font-medium">Show/Hide Rarities</p>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(RARITIES).map(([rarity, label]) => (
                <div key={rarity} className="flex flex-col items-center gap-1.5">
                  <Label 
                    htmlFor={`rarity-${rarity}`} 
                    className="text-sm cursor-pointer"
                    title={label}
                  >
                    <span className="font-mono text-base">{rarity}</span>
                  </Label>
                  <Switch
                    id={`rarity-${rarity}`}
                    checked={rarityToggles[rarity as keyof typeof RARITIES]}
                    onCheckedChange={() => handleToggleChange(rarity as keyof typeof RARITIES)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}; 