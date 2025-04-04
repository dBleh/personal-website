'use client';

import { useState } from 'react';
// Remove usePathname if not used elsewhere in this file
// import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar'; // Adjust path if needed
import './globals.css'; // Ensure this is imported

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // pathname and isGeoBuildPage are not needed here for layout anymore
  // const pathname = usePathname();
  // const isGeoBuildPage = pathname === '/geobuild';

  const [collapsed, setCollapsed] = useState(false);

  return (
    <html lang="en">
      {/* Apply classes directly, remove inline flex style */}
      <body>
        {/* Pass props to Sidebar (which now acts as Nav container) */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Apply class to main content, conditional class for collapsed state */}
        {/* Remove inline styles for paddingLeft, height, overflowY */}
        <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
          {children}
        </main>
      </body>
    </html>
  );
}