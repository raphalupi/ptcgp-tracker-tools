import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle2Icon, AlertCircleIcon, CopyIcon, Loader2Icon } from 'lucide-react';
import { getTradingData, countCards } from '@/lib/trading-utils';
import type { TradingProfile } from '@/lib/types';
import { RARITIES } from '@/lib/types';

export const MyProfile = () => {
  const [profile, setProfile] = useState<TradingProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const tradingData = await getTradingData();
        
        if (!isMounted) return;

        if (tradingData?.profile) {
          setProfile(tradingData.profile);
          setError(null);
        } else {
          setError('Could not find profile data on this page');
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load profile data');
        console.error('Error loading profile:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Load profile data
    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const copyFriendId = async () => {
    if (profile?.user.friend_id) {
      try {
        await navigator.clipboard.writeText(profile.user.friend_id);
      } catch (err) {
        console.error('Failed to copy friend ID:', err);
      }
    }
  };

  const getProfileStatus = () => {
    if (isLoading) {
      return {
        icon: <Loader2Icon className="h-4 w-4 text-muted-foreground animate-spin" />,
        label: "Loading profile..."
      };
    }

    if (error || !profile) {
      return {
        icon: <AlertCircleIcon className="h-4 w-4 text-yellow-500" />,
        label: "Profile data not found"
      };
    }

    return {
      icon: <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />,
      label: "Profile loaded"
    };
  };

  const renderProfileSummary = () => {
    if (!profile) return null;

    const wantedStats = countCards(profile.wanted_cards);
    const tradableStats = countCards(profile.tradable_cards);

    return (
      <div className="mt-2 space-y-4">
        <div className="bg-muted p-3 rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">In Game Name: <b>{profile.user.game_name}</b></p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">Friend ID: <b>{profile.user.friend_id}</b></p>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6"
              onClick={copyFriendId}
              title="Copy Friend ID"
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-1">Wanted Cards</h3>
            <p className="text-muted-foreground">Total: {wantedStats.total}</p>
            <div className="space-y-1 mt-1">
              {Object.entries(wantedStats.byRarity)
                .filter(([, count]) => count > 0)
                .map(([rarity, count]) => (
                  <p key={rarity} className="text-xs">
                    {RARITIES[rarity as keyof typeof RARITIES]}: {count}
                  </p>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Tradable Cards</h3>
            <p className="text-muted-foreground">Total: {tradableStats.total}</p>
            <div className="space-y-1 mt-1">
              {Object.entries(tradableStats.byRarity)
                .filter(([, count]) => count > 0)
                .map(([rarity, count]) => (
                  <p key={rarity} className="text-xs">
                    {RARITIES[rarity as keyof typeof RARITIES]}: {count}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AccordionItem value="profile" className="border-none">
      <AccordionTrigger className="py-2">
        <div className="flex items-center gap-2">
          {getProfileStatus().icon}
          <span>My Profile</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive text-center">
              {error}
            </p>
          ) : isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : renderProfileSummary()}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}; 