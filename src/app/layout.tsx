'use client';

import { useState } from 'react';

import Sidebar from '../components/Sidebar'; 
import '../styles/globals.css'; 

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