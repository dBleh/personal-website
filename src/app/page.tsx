'use client';
import React, { CSSProperties } from 'react';
import Link from 'next/link';
import useMediaQuery from '../hooks/useMediaQuery'; // Adjust path if needed

export default function Home() {

  // --- Instantiate the hook ---
  const isMobile = useMediaQuery('(max-width: 768px)'); // Use the same breakpoint

  // --- Copied Styles from Info.tsx ---
  const navBarStyle: CSSProperties = {
    position: 'fixed',
    top: '40%',
    right: '2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 999,
  };

  const navListStyle: CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    textAlign: 'left',
  };

  const navItemStyle: CSSProperties = {
    marginBottom: '1rem',
  };

  const navLinkStyle: CSSProperties = {
    textDecoration: 'none',
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'color 0.2s ease-in-out',
  };

  // --- Define Navigation Links for Home Page ---
  const navLinksData = [
    { href: '#about-me-section', text: 'About Me' },
    { href: '#skills-section', text: 'Skills' },
    { href: '#projects-section', text: 'Projects' },
  ];

  // --- Scroll Offset Style ---
  // This offset is still useful to account for the main fixed nav (top bar on mobile)
  const scrollOffsetStyle: CSSProperties = {
     paddingTop: '5rem',
     marginTop: '-5rem'
  };

  return (
    <>
      {/* --- Copied Smooth Scrolling Style --- */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        .page-nav-link:hover {
            color: #1d4ed8;
        }
      `}</style>

      {/* --- Conditionally Rendered In-Page Navigation Bar --- */}
      {/* Only render this nav if NOT mobile */}
      {!isMobile && (
        <nav style={navBarStyle}>
          <ul style={navListStyle}>
            {navLinksData.map((link, index) => {
              const currentItemStyle = {
                ...navItemStyle,
                ...(index === navLinksData.length - 1 && { marginBottom: 0 }),
              };

              return (
                <li key={link.href} style={currentItemStyle}>
                  <a href={link.href} style={navLinkStyle} className="page-nav-link">
                    {link.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )} 


   
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <section style={{ marginBottom: '1rem' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', lineHeight: 1.2, fontWeight: 'bold', marginBottom: '0.75rem', color: '#1f2937' }}>Duncan Blais</h1>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#2563eb', fontWeight: 600 }}>Full Stack Developer</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <a
                  href="mailto:Duncanblais@gmail.com"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', textDecoration: 'none' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Duncanblais@gmail.com
                </a>
                <a
                  href="https://github.com/dBleh"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', textDecoration: 'none' }}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="about-me-section" style={{ marginBottom: '3rem', ...scrollOffsetStyle }}>
           <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>About Me</h2>
          <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: '1.625' }}>
            I'm a Full Stack Developer with experience in building web applications, desktop software, and game development.
            My passion lies in creating efficient solutions that solve real-world problems, whether it's developing interactive maps
            for gamers or automating workflow processes for businesses. With a background in Computer Science and professional
            experience at Vancouver Lighting, I bring both technical skills and practical business understanding to my projects.
          </p>
        </section>

        <section id="skills-section" style={{ marginBottom: '3rem', ...scrollOffsetStyle }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>Technical Skills</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {[
              { title: 'Programming Languages', skills: ['C++', 'Python', 'JavaScript', 'TypeScript'] },
              { title: 'Web Development', skills: ['React.js', 'Electron.js', 'Django', 'HTML', 'CSS', 'PixiJS'] },
              { title: 'Databases', skills: ['MySQL', 'MongoDB'] },
              { title: 'Tools & Platforms', skills: ['Git', 'VS Code', 'Windows', 'Node.js', 'SFML', 'Steamworks SDK'] },
            ].map((category) => (
              <div key={category.title}>
                <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#374151', fontSize: '1.125rem' }}>{category.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {category.skills.map((skill) => (
                    <span key={skill} style={{
                      backgroundColor: '#e5e7eb',
                      color: '#1f2937',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects-section" style={{ ...scrollOffsetStyle }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>Featured Projects</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
              }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2563eb' }}>Dark and Darker Tracker</h3>
                  <p style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.5 }}>Interactive map for Dark and Darker with dynamic item filtering and automated game data updates.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {['React.js', 'PixiJS', 'Python', 'Node.js'].map((tech) => (
                          <span key={tech} style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500 }}>
                          {tech}
                          </span>
                      ))}
                  </div>
                  <Link href="/projects" style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}>
                      Learn more →
                  </Link>
              </div>

               <div style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
              }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2563eb' }}>Vancouver Lighting - Tag Creation</h3>
                  <p style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.5 }}>Desktop application automating tag creation, reducing processing time by over 50%.</p>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {['React.js', 'Electron.js', 'Django', 'Python'].map((tech) => (
                          <span key={tech} style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500 }}>
                          {tech}
                          </span>
                      ))}
                  </div>
                  <Link href="/projects" style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}>
                      Learn more →
                  </Link>
              </div>
          </div>
        </section>
      </div>
    </>
  );
}