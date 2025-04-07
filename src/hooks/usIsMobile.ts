import { useState, useEffect } from 'react';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean | null>(null); // Start with null state

  useEffect(() => {
    // Check if running in a browser environment first
    if (typeof window === 'undefined') {
        setIsMobile(false); // Assume not mobile on server
        return;
    }

    let mobileCheck = false;

    // 1. Check userAgentData (if available)
    // Note: navigator.userAgentData requires a secure context (HTTPS)
    // @ts-ignore: Property 'userAgentData' doesn't exist on type 'Navigator' yet in default TS lib
    if (navigator.userAgentData) {
      // @ts-ignore
      mobileCheck = navigator.userAgentData.mobile; // This is a boolean!
    } else {
      // 2. Fallback: Basic User Agent String Check (less reliable)
      // Get the user agent string. navigator.vendor is another fallback, though less common now.
      const userAgentString = navigator.userAgent || navigator.vendor || ''; // Provide empty string as ultimate fallback

      // This is a simplified check, you might need a more robust regex
      mobileCheck = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgentString.toLowerCase());
    }

    setIsMobile(mobileCheck);

  }, []); // Run only once on mount

  // Return the determined value, or a default (e.g., false) if still null
  // You might want loading state handling depending on your UI needs
  return isMobile ?? false;
}

export default useIsMobile;