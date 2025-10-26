
export interface User {
  username: string;
}

export interface Supplication {
  id: string;
  title?: string;
  text: string;
  currentCount: number;
  target: number;
}

export interface SupplicationGroup {
  id:string;
  name: string;
  supplications: Supplication[];
}

export interface UserData {
  groups: SupplicationGroup[];
}

export interface StatisticsSummary {
  today: number;
  week: number;
  month: number;
  allTime: number;
  totalSupplications: number;
  completedSupplications: number;
}

export interface DailyCount {
  date: string;
  total: number;
}

export interface TopSupplication {
  id: string;
  title: string;
  text: string;
  currentCount: number;
  target: number;
  totalCounted: number;
  groupName: string;
}

export interface LibrarySupplication {
  title?: string;
  text: string;
  target: number;
  reference?: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  description: string;
  supplications: LibrarySupplication[];
}

export interface LibraryData {
  categories: LibraryCategory[];
}
