import Link from 'next/link';

export default function Sidebar() {
  return (
    <div style={{
      width: '16rem',
      backgroundColor: '#1f2937', // bg-gray-800
      color: 'white',
      padding: '1.5rem',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      left: 0,
     
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold',
          color: 'white',
          textDecoration: 'none',
          display: 'inline-block',
          padding: '0.25rem 0',
          borderBottom: '2px solid transparent',
          transition: 'border-color 0.2s ease'
        }}>
          Home
        </Link>
      </div>
      
      <nav style={{ 
        flex: 1, 
        overflowY: 'auto',  // Allow scrolling of nav items if they overflow
        paddingRight: '0.5rem'  // Add some padding for scrollbar
      }}>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <li>
            <Link href="/info" style={{ 
              display: 'block',
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.25rem',
              transition: 'background-color 0.2s ease'
            }}>
              Info
            </Link>
          </li>
          <li>
            <Link href="/projects" style={{ 
              display: 'block',
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.25rem',
              transition: 'background-color 0.2s ease'
            }}>
              Projects
            </Link>
          </li>
          <li>
            <Link href="/geobuild" style={{ 
              display: 'block',
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.25rem',
              transition: 'background-color 0.2s ease'
            }}>
              GeoBuild
            </Link>
          </li>
        </ul>
      </nav>
     
    </div>
  );
}