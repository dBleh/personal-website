import React from 'react';
import GeoBuild from './GeoBuild';

export const metadata = {
  title: 'GeoBuild - 3D Building Tool',
  description: 'Create 3D structures with this interactive builder',
};

export default function GeoBuildPage() {
  return (
    <main>
      <GeoBuild />
    </main>
  );
}