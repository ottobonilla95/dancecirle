export interface DanceStyle {
  id: string;
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  category: 'latin' | 'ballroom' | 'street' | 'contemporary' | 'traditional';
  isPartnerDance: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// New interface for user's dance styles with levels
export interface UserDanceStyle {
  danceStyle: string; // DanceStyle ID or name
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export type DanceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'; 