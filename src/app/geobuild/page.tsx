import React from 'react';
import GeoBuild from './GeoBuild';
import useIsMobile from '../../hooks/usIsMobile';
export const metadata = {
  title: 'GeoBuild - 3D Building Tool',
  description: 'Create 3D structures with this interactive builder',
};

export default function GeoBuildPage() {
  const isMobile = useIsMobile()
  return (
    <main>
    {isMobile? <GeoBuild />:"GeoBuild is not supported on mobile devices"}
      
    </main>
  );
}