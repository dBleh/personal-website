'use client';
import React from 'react';

import useMediaQuery from '../hooks/useMediaQuery';

export default function Home() {
  const isSmallBrowser = useMediaQuery('(max-width: 768px)');
  
 
  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        .page-nav-link:hover {
            color: #1d4ed8; /* Tailwind blue-700 */
        }
        /* Removed .project-card styles as they are no longer used here */
      `}</style>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0rem 1rem 2rem 1rem' }}> 
        <section style={{ marginBottom: '1rem' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', lineHeight: 1.2, fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Duncan Blais</h1>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#2563eb', fontWeight: 600 }}>Full Stack Developer</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <a
                  href="mailto:Duncanblais@gmail.com"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', textDecoration: 'none' }}
                  title="Email Duncan"
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
                   title="View Duncan's GitHub profile"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  github.com/dBleh
                </a>
                               </div>
            </div>
          </div>
        </section>

        <section id="about-me-section" style={{ marginBottom: '1rem' }}>
           <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>About Me</h2>
          <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: '1.75' }}>
            I'm a passionate Full Stack Developer with a Computer Science Diploma from Douglas College. I thrive on building diverse applications, from dynamic web experiences and helpful desktop tools to engaging game prototypes.
            My core drive is crafting efficient, user-focused solutions that tackle real-world challenges – whether that's creating an interactive map used by thousands of gamers or automating complex business workflows to save significant time. I bring a blend of strong technical skills and practical experience from my development work and role at Vancouver Lighting, allowing me to bridge the gap between technical implementation and user needs.
          </p>
        </section>

        <section id="skills-section" style={{ marginBottom: '0rem' }}> 
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>Technical Skills</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}> 
            {[
              { title: 'Programming Languages', skills: ['C++', 'Python', 'JavaScript'] },
              { title: 'Web Development', skills: ['React.js', 'Next.js', 'Node.js', 'Electron.js', 'Django', 'PixiJS', 'HTML', 'CSS', 'Three.js'] },
              { title: 'Databases', skills: ['MySQL', 'MongoDB'] },
              { title: 'Tools & Platforms', skills: ['Git', 'VS Code', 'Windows', 'Steamworks SDK', 'SFML'] },
            ].map((category) => (
              <div key={category.title}>
                <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#374151', fontSize: '1.125rem' }}>{category.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {category.skills.map((skill) => (
                    <span key={skill} style={{
                      backgroundColor: '#e5e7eb',
                      color: '#374151',      
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
      </div> 
    </>
  );
}