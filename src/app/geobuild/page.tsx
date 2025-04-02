'use client';

import dynamic from 'next/dynamic';

// We need to dynamically import the GeoBuild component with SSR disabled
// because it uses browser-only APIs (THREE.js)
const GeoBuildComponent = dynamic(
  () => import('./GeoBuild'),
  { ssr: false }
);

export default function GeoBuildPage() {
  return (
    <div className="w-full h-screen bg-gray-100">
      <GeoBuildComponent />
    </div>
  );
}