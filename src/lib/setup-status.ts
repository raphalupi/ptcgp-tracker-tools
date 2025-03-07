import { CollectionData } from '@/types/types';
import { differenceInHours } from 'date-fns';

export const STALE_DATA_HOURS = 24 * 7;

export interface SetupStatus {
  needsAttention: boolean;
  isStale: boolean;
  reason?: string;
}

export const checkSetupStatus = (
  profileUrl: string | null,
  collection: CollectionData | null,
): SetupStatus => {
  // No profile URL set
  if (!profileUrl) {
    return {
      needsAttention: true,
      isStale: false,
      reason: 'No profile URL set'
    };
  }

  // No collection data
  if (!collection) {
    return {
      needsAttention: true,
      isStale: false,
      reason: 'No collection data'
    };
  }

  // Check if data is stale
  const hoursAgo = differenceInHours(Date.now(), collection.lastUpdate);
  const isStale = hoursAgo >= STALE_DATA_HOURS;

  return {
    needsAttention: isStale,
    isStale,
    reason: isStale ? 'Collection data is stale' : undefined
  };
}; 