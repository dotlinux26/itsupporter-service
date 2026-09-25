import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls window to top on page / route transition,
 * except when navigating inside the chat interface (/orders/:id/chat).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!pathname.includes('/chat')) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [pathname]);

  return null;
}
