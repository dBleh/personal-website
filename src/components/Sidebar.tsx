import Link from 'next/link';
import React from 'react'; // Import React for types like Dispatch, SetStateAction

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const sidebarWidth = collapsed ? '4rem' : '10rem'; // Define widths here

  return (
    <div style={{
      width: sidebarWidth,
      height: '100vh',
      backgroundColor: '#1f2937', // Dark background
      color: 'white',
      padding: collapsed ? '1.5rem 0.5rem' : '1.5rem', // Adjust padding when collapsed
      position: 'fixed', // Fixed position
      top: 0,
      left: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between', // Pushes toggle button to bottom
      transition: 'width 0.3s ease', // Smooth transition for width change
      overflow: 'hidden', // Prevents scrollbars on the sidebar itself
      boxSizing: 'border-box', // Include padding in width calculation
    }}>
      {/* Top section: Logo/Home link and Navigation */}
      <div>
        {/* Home Link */}
        <div style={{
          marginBottom: '2rem',
          textAlign: collapsed ? 'center' : 'left', // Center icon when collapsed
        }}>
          <Link href="/" style={{
            fontSize: collapsed ? '1rem' : '1.25rem',
            fontWeight: 'bold',
            color: 'white',
            textDecoration: 'none',
            display: 'inline-block', // Needed for centering/alignment
            padding: '0.25rem 0', // Minimal padding
            borderBottom: '2px solid transparent', // Optional: visual flair
          }}>
            {collapsed ? (
              // Home Icon
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            ) : 'Home'}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem', // Space between links
            alignItems: collapsed ? 'center' : 'stretch', // Center icons or stretch text links
          }}>
            {/* Info Link */}
            <li>
              <Link href="/info" style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '0.75rem', // No gap needed when only icon
                color: 'white',
                textDecoration: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.25rem',
                transition: 'background-color 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start', // Center icon
                whiteSpace: 'nowrap', // Prevent text wrapping
              }}
              title="Info" // Tooltip for collapsed state
              >
                {/* Info Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                {!collapsed && <span>Info</span>}
              </Link>
            </li>

            {/* Projects Link */}
            <li>
              <Link href="/projects" style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '0.75rem',
                color: 'white',
                textDecoration: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.25rem',
                transition: 'background-color 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                whiteSpace: 'nowrap',
              }}
              title="Projects"
              >
                {/* Projects Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                {!collapsed && <span>Projects</span>}
              </Link>
            </li>

             {/* GeoBuild Link */}
             <li>
              <Link href="/geobuild" style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '0.75rem',
                color: 'white',
                textDecoration: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.25rem',
                transition: 'background-color 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                whiteSpace: 'nowrap',
              }}
              title="GeoBuild"
              >
                 {/* GeoBuild Icon */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                {!collapsed && <span>GeoBuild</span>}
              </Link>
            </li>

          </ul>
        </nav>
      </div>

      {/* Bottom section: Toggle Button and Copyright */}
      <div>
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight background
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.75rem',
            display: 'flex', // Use flex to center icon
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%', // Full width of its container
            borderRadius: '0.25rem',
            marginBottom: '1rem', // Space before copyright
          }}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"} // Tooltip
        >
          {collapsed ? (
            // Expand Icon (Double Chevron Right)
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          ) : (
            // Collapse Icon (Double Chevron Left)
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          )}
        </button>

        {/* Copyright */}
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.6)', // Muted color
          textAlign: 'center',
          padding: '0.5rem 0',
          whiteSpace: 'nowrap', // Prevent wrapping
        }}>
          {collapsed ? `© ${new Date().getFullYear()}` : `© ${new Date().getFullYear()} Duncan Blais`}
        </div>
      </div>
    </div>
  );
}