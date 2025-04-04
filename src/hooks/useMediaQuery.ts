import { useState, useEffect } from 'react';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);

      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      setMatches(mediaQueryList.matches);

      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', listener);
      } else {
        mediaQueryList.addListener(listener);
      }
      return () => {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', listener);
        } else {
          mediaQueryList.removeListener(listener);
        }
      };
    }
  }, [query]);

  return matches;
}

export default useMediaQuery;