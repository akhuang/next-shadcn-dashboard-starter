export interface NavigationItem {
  id: string;
  category: string;
  name: string;
  url: string;
  description: string;
  isExternal?: boolean;
}

export interface UserNavigationData {
  userId: string;
  recentVisits: NavigationVisit[];
  favorites: string[]; // Navigation item IDs
}

export interface NavigationVisit {
  itemId: string;
  visitedAt: Date;
  count: number;
}

export interface NavigationCategory {
  id: string;
  name: string;
  items: NavigationItem[];
}

export interface ExcelNavigationRow {
  类别: string;
  名字: string;
  链接: string;
  说明: string;
}
