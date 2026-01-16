import type { ReviewCard } from './types'; 

export interface ReviewStep {
  id: number;
  label: string;
  // 2. Самое важное: keyof ReviewCard гарантирует, 
  // что мы можем использовать только реальные поля (originalWord, translation)
  sourceKey: keyof ReviewCard; 
  targetKey: keyof ReviewCard; 
  placeholder: string;
}

export const REVIEW_STEPS: ReviewStep[] = [
  // Цикл 1
  { 
    id: 0, 
    label: 'Раунд 1: Перевод', 
    sourceKey: 'originalWord',  // Показываем Оригинал
    targetKey: 'translation',   // Скрываем Перевод
    placeholder: 'Пишите перевод...' 
  },
  { 
    id: 1, 
    label: 'Раунд 1: Обратно', 
    sourceKey: 'translation',   // Показываем Перевод
    targetKey: 'originalWord',  // Скрываем Оригинал
   placeholder: 'Пишите перевод...' 
  },
  
  // Цикл 2
  { 
    id: 2, 
    label: 'Раунд 3: Перевод', 
    sourceKey: 'originalWord',  // Показываем Оригинал
    targetKey: 'translation',   // Скрываем Перевод
    placeholder: 'Пишите перевод...' 
  },
  { 
    id: 3, 
    label: 'Раунд 4: Обратно', 
    sourceKey: 'translation',   // Показываем Перевод
    targetKey: 'originalWord',  // Скрываем Оригинал
   placeholder: 'Пишите перевод...' 
  },
  
  // Цикл 3
  { 
    id: 4, 
    label: 'Раунд 5: Перевод', 
    sourceKey: 'originalWord',  // Показываем Оригинал
    targetKey: 'translation',   // Скрываем Перевод
   placeholder: 'Пишите перевод...' 
  },
  { 
    id: 5, 
    label: 'Раунд 6: Обратно', 
    sourceKey: 'translation',   // Показываем Перевод
    targetKey: 'originalWord',  // Скрываем Оригинал
   placeholder: 'Пишите перевод...' 
  },

  // Цикл 4
  { 
    id: 6, 
    label: 'Раунд 7: Перевод', 
    sourceKey: 'originalWord',  // Показываем Оригинал
    targetKey: 'translation',   // Скрываем Перевод
    placeholder: 'Пишите перевод...' 
  },
  { 
    id: 7, 
    label: 'Раунд 8: Обратно', 
    sourceKey: 'translation',   // Показываем Перевод
    targetKey: 'originalWord',  // Скрываем Оригинал
   placeholder: 'Пишите перевод...' 
  },
];