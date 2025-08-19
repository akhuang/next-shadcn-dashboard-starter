'use server';

import { auth } from '@clerk/nextjs/server';
import { navigationService } from '@/lib/navigation-redis-service';
import type {
  NavigationCategory,
  UserNavigationData
} from '@/types/navigation';

export async function getNavigationData(): Promise<NavigationCategory[]> {
  try {
    const data = await navigationService.getNavigationData();
    return data;
  } catch (error) {
    console.error('Error fetching navigation data:', error);
    return [];
  }
}

export async function getUserNavigationData(): Promise<UserNavigationData | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const userData = await navigationService.getUserData(userId);
    return userData;
  } catch (error) {
    console.error('Error fetching user navigation data:', error);
    return null;
  }
}

export async function addRecentVisit(
  itemId: string
): Promise<UserNavigationData | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const userData = await navigationService.addRecentVisit(userId, itemId);
    return userData;
  } catch (error) {
    console.error('Error adding recent visit:', error);
    return null;
  }
}

export async function toggleFavorite(
  itemId: string
): Promise<UserNavigationData | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const userData = await navigationService.toggleFavorite(userId, itemId);
    return userData;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return null;
  }
}

export async function clearRecentVisits(): Promise<UserNavigationData | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const userData = await navigationService.clearRecentVisits(userId);
    return userData;
  } catch (error) {
    console.error('Error clearing recent visits:', error);
    return null;
  }
}

export async function getNavigationStatus(): Promise<{
  lastUpdate: Date | null;
  fileStatus: any;
}> {
  try {
    const [lastUpdate, fileStatus] = await Promise.all([
      navigationService.getLastUpdate(),
      navigationService.getFileStatus()
    ]);

    return { lastUpdate, fileStatus };
  } catch (error) {
    console.error('Error fetching navigation status:', error);
    return { lastUpdate: null, fileStatus: null };
  }
}
