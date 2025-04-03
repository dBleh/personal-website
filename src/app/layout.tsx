'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isGeoBuildPage = pathname === '/geobuild';
  
  return (
    <html lang="en">
      <body>
        { <Sidebar />}
        
        <main >
          {children}
        </main>
      </body>
    </html>
  );
}