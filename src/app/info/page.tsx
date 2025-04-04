'use client';

import React, { CSSProperties } from 'react';
import useMediaQuery from '../../hooks/useMediaQuery'; 

export default function Info() {

  const isMobile = useMediaQuery('(max-width: 768px)');

  // Style for the navigation bar container
  const navBarStyle: CSSProperties = {
    position: 'fixed',
    top: '40%',
    right: '2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 999, // Below main nav if necessary
  };

  // Style for the navigation list
  const navListStyle: CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    textAlign: 'left',
  };

  // Style for each navigation item
  const navItemStyle: CSSProperties = {
    marginBottom: '1rem',
  };

  // Style for the navigation links
  const navLinkStyle: CSSProperties = {
    textDecoration: 'none',
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'color 0.2s ease-in-out',
  };

  // Define the navigation links
  const navLinksData = [
    { href: '#education-section', text: 'Education' },
    { href: '#experience-section', text: 'Experience' },
    { href: '#contact-section', text: 'Contact Info' },
  ];

  const scrollOffsetStyle: CSSProperties = {
     paddingTop: '5rem', 
     marginTop: '-5rem' 
  };


  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        /* Rename class slightly to be specific to this page if needed */
        .info-nav-link:hover {
            color: #1d4ed8;
        }
      `}</style>


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
                  <a href={link.href} style={navLinkStyle} className="info-nav-link">
                    {link.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}


      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          color: '#1f2937',
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '0.5rem'
        }}>
          Professional Information
        </h1>

        <section id="education-section" style={{ marginBottom: '2.5rem', ...scrollOffsetStyle }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Education</h2>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb'
          }}>
             <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.25rem' }}>Computer Science Diploma</h3>
                <p style={{ color: '#111827', marginBottom: '0.25rem' }}>Douglas College, New Westminster</p>
              </div>
              <p style={{ color: '#4b5563', flexShrink: 0 }}>Jan 2018 – Dec 2022</p>
            </div>
            <p style={{ marginTop: '1rem', color: '#374151', lineHeight: 1.6 }}>
              Completed a comprehensive program covering software development, algorithms, data structures, and database design.
            </p>
          </div>
        </section>

        <section id="experience-section" style={{ marginBottom: '2.5rem', ...scrollOffsetStyle }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Professional Experience</h2>

          <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.25rem' }}>Sales Associate & Developer</h3>
                <p style={{ color: '#111827', marginBottom: '0.25rem' }}>Vancouver Lighting, Coquitlam</p>
              </div>
              <p style={{ color: '#4b5563', flexShrink: 0 }}>Jan 2017 - Present</p>
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: '#374151', listStyleType: 'disc', lineHeight: 1.6, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>Developed an automation tool to improve operational efficiency, reducing tag processing time by over 50%</li>
              <li style={{ marginBottom: '0.5rem' }}>Assisted customers with technical troubleshooting and product selection</li>
              <li>Balanced technical development work with customer-facing responsibilities</li>
            </ul>
          </div>

          <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.25rem' }}>Lead Tennis Instructor</h3>
                <p style={{ color: '#111827', marginBottom: '0.25rem' }}>City of New Westminster</p>
              </div>
              <p style={{ color: '#4b5563', flexShrink: 0 }}>Nov 2020 - Present</p>
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: '#374151', listStyleType: 'disc', lineHeight: 1.6, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>Designed and led inclusive training programs for various skill levels</li>
              <li style={{ marginBottom: '0.5rem' }}>Provided mentorship and leadership to volunteers</li>
              <li>Developed strong communication skills working with diverse groups</li>
            </ul>
          </div>

          <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb'
          }}>
             <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.25rem' }}>Gymnastics Instructor</h3>
                <p style={{ color: '#111827', marginBottom: '0.25rem' }}>City of New Westminster</p>
              </div>
              <p style={{ color: '#4b5563', flexShrink: 0 }}>Nov 2015 - 2020</p>
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: '#374151', listStyleType: 'disc', lineHeight: 1.6, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>Taught gymnastics skills to children of various ages and abilities</li>
              <li style={{ marginBottom: '0.5rem' }}>Ensured safety procedures were followed during all activities</li>
              <li>Developed strong leadership and organizational skills</li>
            </ul>
          </div>
        </section>

        <section id="contact-section" style={{ ...scrollOffsetStyle }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Contact Information</h2>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb'
          }}>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a href="mailto:Duncanblais@gmail.com" style={{ color: '#111827', textDecoration: 'none', wordBreak: 'break-all' }}>Duncanblais@gmail.com</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <a href="tel:672-514-8325" style={{ color: '#111827', textDecoration: 'none', whiteSpace: 'nowrap' }}>672-514-8325</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2563eb" style={{ flexShrink: 0 }}>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                <a href="https://github.com/dBleh" target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'none', wordBreak: 'break-all' }}>github.com/dBleh</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}