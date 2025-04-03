import Link from 'next/link';

export default function Sidebar() {
  return (
    <div style={{
      width: '10rem',
      height: '100vh', // Full viewport height
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '1.5rem',
      position: 'fixed', // Fixed position so it stays in place when scrolling
      top: 0,
      left: 0,
      bottom: 0, // Ensure it extends all the way to the bottom
      overflowY: 'auto', // Enable vertical scrolling for the sidebar content
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

      <nav style={{ flex: 1 }}>
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
              transition: 'background-color 0.2s ease',
         
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
              transition: 'background-color 0.2s ease',
            
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
              transition: 'background-color 0.2s ease',
          
            }}>
              GeoBuild
            </Link>
          </li>
        </ul>
        <div style={{ 
        marginTop: 'auto', 
        fontSize: '0.875rem', 
        color: 'rgba(255, 255, 255, 0.6)',
        paddingTop: '40rem' 
      }}>
        &copy; {new Date().getFullYear()} Duncan Blais
      </div>
      </nav>

     
    </div>
  );
}

