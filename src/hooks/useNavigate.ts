import { useCallback } from 'react';
import { useWebinarStore } from '../stores/webinarStore';

export function useNavigate() {
  const { setShowKnowledgeBase } = useWebinarStore();

  const navigateToKnowledge = useCallback(() => {
    setShowKnowledgeBase(true);
  }, [setShowKnowledgeBase]);

  return { navigateToKnowledge };
}