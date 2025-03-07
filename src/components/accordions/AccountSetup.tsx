import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CollectionData, ScrapeResponse, ScrapeMessage } from '@/types/types';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { CheckCircle2Icon, AlertCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define rarity order (♢ < ♢♢ < ♢♢♢ < ♢♢♢♢ < ☆)
const RARITY_ORDER: { [key: string]: number } = {
  '♢': 1,
  '♢♢': 2,
  '♢♢♢': 3,
  '♢♢♢♢': 4,
  '☆': 5,
};

const VALID_URL_PREFIX = 'https://ptcgp-tracker.com/u/';
const STALE_DATA_HOURS = 24; // Consider data stale after 24 hours

type CollectionType = 'wanted' | 'tradable';

export const AccountSetup = () => {
  const [profileUrl, setProfileUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    // Load saved profile URL and collection data
    chrome.storage.local.get(['profileUrl', 'collection'], (result) => {
      if (result.profileUrl) setProfileUrl(result.profileUrl);
      if (result.collection) setCollection(result.collection);
    });

    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) setCurrentUrl(tabs[0].url);
    });
  }, []);

  const validateUrl = (url: string) => {
    if (!url.startsWith(VALID_URL_PREFIX)) {
      setUrlError('URL must start with ' + VALID_URL_PREFIX);
      return false;
    }
    setUrlError(null);
    return true;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setProfileUrl(newUrl);
    validateUrl(newUrl);
  };

  const handleSaveProfile = async () => {
    try {
      if (!profileUrl) return;
      if (!validateUrl(profileUrl)) return;
      
      await chrome.storage.local.set({ profileUrl });
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to save profile URL');
    }
  };

  const handleExtractCollection = async () => {
    try {
      setIsExtracting(true);
      setError(null);
      
      // Send message to content script to extract data
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      console.log('Sending scrape message to tab:', tab.id);
      const message: ScrapeMessage = { action: 'scrape' };
      
      // First check if we can inject the content script
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('Content script injected successfully');
      } catch (injectError) {
        console.error('Error injecting content script:', injectError);
        throw new Error('Failed to inject content script');
      }

      // Now send the message
      const response = await chrome.tabs.sendMessage<ScrapeMessage, ScrapeResponse>(tab.id, message);
      console.log('Received response:', response);
      
      if (response?.error) {
        throw new Error(response.error);
      }
      
      if (response?.collection) {
        const collectionData: CollectionData = {
          wanted: response.collection.wanted || {},
          tradable: response.collection.tradable || {},
          lastUpdate: Date.now(),
          userInfo: response.collection.userInfo || {
            inGameName: 'Unknown',
            friendId: 'Unknown',
          },
          stats: {
            wanted: {
              total: 0,
              byRarity: {},
            },
            tradable: {
              total: 0,
              byRarity: {},
            },
          },
        };

        // Calculate stats
        (['wanted', 'tradable'] as CollectionType[]).forEach((type) => {
          Object.values(collectionData[type]).forEach((setData) => {
            Object.entries(setData).forEach(([rarity, cards]) => {
              collectionData.stats[type].total += cards.length;
              collectionData.stats[type].byRarity[rarity] = 
                (collectionData.stats[type].byRarity[rarity] || 0) + cards.length;
            });
          });
        });

        console.log('Collection data processed:', collectionData);
        setCollection(collectionData);
        await chrome.storage.local.set({ collection: collectionData });
      } else {
        throw new Error('No collection data received');
      }
    } catch (err) {
      console.error('Error extracting collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract collection');
    } finally {
      setIsExtracting(false);
    }
  };

  const isOnProfilePage = currentUrl === profileUrl;

  const getSetupStatus = () => {
    if (!profileUrl || urlError) {
      return {
        icon: <AlertCircleIcon className="h-4 w-4 text-orange-500" />,
        label: "Profile URL needed"
      };
    }

    if (!collection) {
      return {
        icon: <AlertCircleIcon className="h-4 w-4 text-orange-500" />,
        label: "Collection data needed"
      };
    }

    const hoursAgo = differenceInHours(Date.now(), collection.lastUpdate);
    const isStale = hoursAgo >= STALE_DATA_HOURS;

    return {
      icon: <CheckCircle2Icon className={cn("h-4 w-4", isStale ? "text-yellow-500" : "text-emerald-500")} />,
      label: isStale ? "Data needs refresh" : "Setup complete"
    };
  };

  const renderCollectionSummary = () => {
    if (!collection) return null;

    return (
      <div className="mt-4 space-y-2 text-sm">
        <p className="text-muted-foreground">
          Last extracted: {formatDistanceToNow(collection.lastUpdate)} ago
        </p>
        
        {collection.userInfo && (
          <div className="bg-muted p-2 rounded-md">
            <p className="text-sm">In Game Name: <b>{collection.userInfo.inGameName}</b></p>
            <p className="text-sm">Friend ID: <b>{collection.userInfo.friendId}</b></p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-1">Wanted Cards</h3>
            <p className="text-muted-foreground">Total: {collection.stats.wanted.total}</p>
            <div className="space-y-1 mt-1">
              {Object.entries(collection.stats.wanted.byRarity)
                .sort(([rarityA], [rarityB]) => RARITY_ORDER[rarityA] - RARITY_ORDER[rarityB])
                .map(([rarity, count]) => (
                  <p key={rarity} className="text-xs">
                    {rarity}: {count}
                  </p>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Tradable Cards</h3>
            <p className="text-muted-foreground">Total: {collection.stats.tradable.total}</p>
            <div className="space-y-1 mt-1">
              {Object.entries(collection.stats.tradable.byRarity)
                .sort(([rarityA], [rarityB]) => RARITY_ORDER[rarityA] - RARITY_ORDER[rarityB])
                .map(([rarity, count]) => (
                  <p key={rarity} className="text-xs">
                    {rarity}: {count}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AccordionItem value="account" className="border-none">
      <AccordionTrigger className="py-2">
        <div className="flex items-center gap-2">
          {getSetupStatus().icon}
          <span>Account Setup</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="profile-url text-sm">Trading Profile URL</Label>
            <div className="flex gap-2">
              <Input
                id="profile-url"
                className="flex-1 text-sm"
                value={profileUrl}
                onChange={handleUrlChange}
                placeholder={VALID_URL_PREFIX}
              />
              <Button 
                onClick={handleSaveProfile}
                disabled={!profileUrl || !!urlError}
                className="shrink-0"
              >
                Save
              </Button>
            </div>
            {urlError && (
              <p className="text-sm text-destructive">{urlError}</p>
            )}
          </div>

            <div className="space-y-2 pt-2">
              {isOnProfilePage ? (
                <>
                  <Button 
                    className="w-full" 
                    onClick={handleExtractCollection}
                    disabled={isExtracting || !profileUrl || !!urlError}
                  >
                    {isExtracting ? 'Extracting profile...' : 'Extract Collection Data'}
                  </Button>
                  {error && (
                    <p className="text-sm text-destructive text-center">
                      {error}
                    </p>
                  )}
                  {renderCollectionSummary()}
                </>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You need to be on your Trading Profile page to extract collection data.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => chrome.tabs.create({ url: profileUrl })}
                  >
                    Go to Profile Page
                  </Button>
                </div>
              )}
            </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}; 