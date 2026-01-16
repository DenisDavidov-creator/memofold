export interface UserStats {
  totalWordsLearning: number; // Слов в активных
  totalWordsMastered: number; // Слов в архиве (новое!)
  activeDecksCount: number; 
  archivedDecksCount: number;
  totalReviews: number;       // Кол-во записей в card_history (новое!)
}

export interface UserProfile {
  id: number;
  email: string;
  login: string;
  status: 'free' | 'premium' | 'lifetime';
  premiumExpiresAt?: string;
}

export interface FullProfile {
  user: UserProfile;
  stats: UserStats;
}