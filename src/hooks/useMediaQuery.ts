// hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

function useMediaQuery(query: string): boolean {
  // Initialize state, defaulting to false server-side or before hydration
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window.matchMedia is available (client-side)
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);

      // Function to update state based on match status
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Set the initial state correctly on the client
      setMatches(mediaQueryList.matches);

      // Add listener for changes
      // Using addEventListener for modern browsers, fall back for older ones
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', listener);
      } else {
        // Deprecated method for older browsers
        mediaQueryList.addListener(listener);
      }

      // Cleanup function to remove listener on component unmount
      return () => {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', listener);
        } else {
          mediaQueryList.removeListener(listener);
        }
      };
    }
  }, [query]); // Re-run effect if query changes

  return matches;
}

export default useMediaQuery;