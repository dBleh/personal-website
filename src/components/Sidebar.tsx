// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import React from 'react';
import useMediaQuery from '../hooks/useMediaQuery'; // Adjust path

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const isMobile = useMediaQuery('(max-width: 768px)'); 


  const handleGeoBuildNotice = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    alert('GeoBuild is not available on Mobile devices');
  };

  const showText = isMobile ? true : !collapsed; 
  const showFullCopyright = isMobile ? false : !collapsed;


  const navContainerClasses = `nav-container ${!isMobile && collapsed ? 'collapsed' : ''}`;

  return (
    <div className={navContainerClasses}>
      <div className="nav-top-section">
        <nav
          className="nav-links"
          style={{ marginBottom: isMobile ? '0' : '2rem' }}
        >
          <ul>
            <li>
              <Link href="/" title="Home">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                {showText && <span className="nav-link-text" >Home</span>}
              </Link>
            </li>
            <li>
              <Link href="/info" title="Info">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                {showText && <span className="nav-link-text">Info</span>}
              </Link>
            </li>
            <li>
              <Link href="/projects" title="Projects">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                {showText && <span className="nav-link-text">Projects</span>}
              </Link>
            </li>
            <li>
              {isMobile ? (
                 <button onClick={handleGeoBuildNotice} title="GeoBuild (Desktop Recommended)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    <span className="nav-link-text">GeoBuild</span>
                </button>
              ) : (
                <Link href="/geobuild" title="GeoBuild">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                  {showText && <span className="nav-link-text">GeoBuild</span>}
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div> 
      {!isMobile && (
         <div className="nav-bottom-section">
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="toggle-button"
                title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {collapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                )}
            </button>
            <div className="copyright">
                {`© ${new Date().getFullYear()}`}
                {showFullCopyright && <span className="copyright-text"> Duncan Blais</span>}
            </div>
        </div>
      )}
    </div>
  );
}