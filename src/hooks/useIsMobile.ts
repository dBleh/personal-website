'use client';
import { useState, useEffect } from 'react';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean | null>(null); 

  useEffect(() => {
    if (typeof window === 'undefined') {
        setIsMobile(false); 
        return;
    }

    let mobileCheck = false;

    // @ts-ignore
    if (navigator.userAgentData) {
      // @ts-ignore
      mobileCheck = navigator.userAgentData.mobile; 
    } else {

      const userAgentString = navigator.userAgent || navigator.vendor || ''; 

      mobileCheck = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgentString.toLowerCase());
    }

    setIsMobile(mobileCheck);

  }, []);


  return isMobile ?? false;
}

export default useIsMobile;