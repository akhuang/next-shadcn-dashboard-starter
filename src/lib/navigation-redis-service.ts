import redis, { CACHE_TTL } from './redis';
import type {
  NavigationCategory,
  UserNavigationData
} from '@/types/navigation';

const CACHE_KEYS = {
  NAVIGATION_DATA: 'navigation:data',
  USER_DATA: (userId: string) => `navigation:user:${userId}`,
  LAST_UPDATE: 'navigation:last_update',
  FILE_STATUS: 'navigation:file_status'
};

class NavigationRedisService {
  async getNavigationData(): Promise<NavigationCategory[]> {
    try {
      const cached = await redis.get(CACHE_KEYS.NAVIGATION_DATA);
      if (cached) {
        return JSON.parse(cached);
      }
      return [];
    } catch (error) {
      console.error('Error fetching navigation data from Redis:', error);
      return [];
    }
  }

  async getUserData(userId: string): Promise<UserNavigationData> {
    try {
      const cached = await redis.get(CACHE_KEYS.USER_DATA(userId));
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error fetching user data from Redis:', error);
    }

    return {
      userId,
      recentVisits: [],
      favorites: []
    };
  }

  async addRecentVisit(
    userId: string,
    itemId: string
  ): Promise<UserNavigationData> {
    const userData = await this.getUserData(userId);

    // Find existing visit or create new
    const existingIndex = userData.recentVisits.findIndex(
      (v) => v.itemId === itemId
    );

    if (existingIndex >= 0) {
      // Update existing visit
      userData.recentVisits[existingIndex].visitedAt = new Date();
      userData.recentVisits[existingIndex].count++;

      // Move to front
      const [visit] = userData.recentVisits.splice(existingIndex, 1);
      userData.recentVisits.unshift(visit);
    } else {
      // Add new visit
      userData.recentVisits.unshift({
        itemId,
        visitedAt: new Date(),
        count: 1
      });
    }

    // Keep only last 20 visits
    userData.recentVisits = userData.recentVisits.slice(0, 20);

    await redis.set(
      CACHE_KEYS.USER_DATA(userId),
      JSON.stringify(userData),
      'EX',
      CACHE_TTL.USER_DATA || 86400 * 7 // 7 days
    );

    return userData;
  }

  async toggleFavorite(
    userId: string,
    itemId: string
  ): Promise<UserNavigationData> {
    const userData = await this.getUserData(userId);

    const index = userData.favorites.indexOf(itemId);
    if (index >= 0) {
      userData.favorites.splice(index, 1);
    } else {
      userData.favorites.push(itemId);
    }

    await redis.set(
      CACHE_KEYS.USER_DATA(userId),
      JSON.stringify(userData),
      'EX',
      CACHE_TTL.USER_DATA || 86400 * 7 // 7 days
    );

    return userData;
  }

  async clearRecentVisits(userId: string): Promise<UserNavigationData> {
    const userData = await this.getUserData(userId);
    userData.recentVisits = [];

    await redis.set(
      CACHE_KEYS.USER_DATA(userId),
      JSON.stringify(userData),
      'EX',
      CACHE_TTL.USER_DATA || 86400 * 7 // 7 days
    );

    return userData;
  }

  async getFileStatus(): Promise<any> {
    try {
      const cached = await redis.get(CACHE_KEYS.FILE_STATUS);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error fetching file status from Redis:', error);
    }
    return null;
  }

  async getLastUpdate(): Promise<Date | null> {
    try {
      const lastUpdate = await redis.get(CACHE_KEYS.LAST_UPDATE);
      if (lastUpdate) {
        return new Date(lastUpdate);
      }
    } catch (error) {
      console.error('Error fetching last update from Redis:', error);
    }
    return null;
  }
}

export const navigationService = new NavigationRedisService();
