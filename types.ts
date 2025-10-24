
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
