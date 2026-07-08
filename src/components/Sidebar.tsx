'use client';

import Link from 'next/link';
import React from 'react';
import useMediaQuery from '../hooks/useMediaQuery';
import '../styles/sidebar.css';
interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const isSmallBrower = useMediaQuery('(max-width: 768px)');

  const showText = isSmallBrower ? true : !collapsed;
  const showFullCopyright = isSmallBrower ? false : !collapsed;


  const navContainerClasses = `nav-container ${!isSmallBrower && collapsed ? 'collapsed' : ''}`;

  return (
    <div className={navContainerClasses}>
      <div className="nav-top-section">
        <nav
          className="nav-links"
          style={{ marginBottom: isSmallBrower ? '0' : '2rem' }}
        >
          <ul>
            <li>
              <Link href="/" title="Knee Tracker">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                {showText && <span className="nav-link-text" >Tracker</span>}
              </Link>
            </li>
            <li>
              <Link href="/info" title="Guide">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                {showText && <span className="nav-link-text">Guide</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div> 
      {!isSmallBrower && (
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