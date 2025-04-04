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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <html lang="en">
     
      <body>   
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
          {children}
        </main>
      </body>
    </html>
  );
}