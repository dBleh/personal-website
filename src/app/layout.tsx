'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import './globals.css'; // Make sure this contains necessary base styles (like body margin: 0)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isGeoBuildPage = pathname === '/geobuild'; // This variable is declared as requested but not used to change layout structure below

  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? '4rem' : '10rem'; // Match widths defined in Sidebar.tsx

  return (
    <html lang="en">
      <body style={{ display: 'flex', margin: 0 }}> {/* Ensure no default body margin */}
        {/* Sidebar is always rendered based on original structure */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main content area with dynamic padding based on sidebar state */}
        <main style={{
          flexGrow: 1, // Takes up remaining space
          paddingLeft: sidebarWidth, // Adjust padding based on sidebar width
          transition: 'padding-left 0.3s ease', // Smooth transition for content shift
          overflowY: 'auto', // Allow scrolling within the main content area if needed
          height: '100vh' // Ensure main takes full viewport height for scrolling
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}