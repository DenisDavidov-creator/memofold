import { createContext, useContext, useState, type ReactNode } from 'react';

interface ReviewContextType {
  isSessionActive: boolean;
  setSessionActive: (active: boolean) => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const [isSessionActive, setSessionActive] = useState(false);
  return (
    <ReviewContext.Provider value={{ isSessionActive, setSessionActive }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviewSession = () => {
  const context = useContext(ReviewContext);
  if (!context) throw new Error('useReviewSession must be used within ReviewProvider');
  return context;
};