import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto" style={{marginLeft: '220px'}}>
      <section className="mb-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Profile image placeholder */}
          <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-800" style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            {/* Image will go here */}
          </div>
          
          <div>
            <h1 className="text-5xl font-bold mb-3" style={{ color: '#1f2937' }}>Duncan Blais</h1>
            <h2 className="text-2xl mb-4" style={{ color: '#2563eb' }}>Full Stack Developer</h2>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <a 
                href="mailto:Duncanblais@gmail.com" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Duncanblais@gmail.com
              </a>
              
              <a 
                href="tel:672-514-8325" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                672-514-8325
              </a>
              
              <a 
                href="https://github.com/dBleh" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}
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
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>About Me</h2>
        <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: '1.625' }}>
          I'm a Full Stack Developer with experience in building web applications, desktop software, and game development.
          My passion lies in creating efficient solutions that solve real-world problems, whether it's developing interactive maps
          for gamers or automating workflow processes for businesses. With a background in Computer Science and professional
          experience at Vancouver Lighting, I bring both technical skills and practical business understanding to my projects.
        </p>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>Technical Skills</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#4b5563' }}>Programming Languages</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['C++', 'Python', 'JavaScript', 'TypeScript'].map((skill) => (
                <span key={skill} style={{ 
                  backgroundColor: '#e5e7eb', 
                  color: '#1f2937', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.875rem' 
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#4b5563' }}>Web Development</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['React.js', 'Electron.js', 'Django', 'HTML', 'CSS', 'PixiJS'].map((skill) => (
                <span key={skill} style={{ 
                  backgroundColor: '#e5e7eb', 
                  color: '#1f2937', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.875rem' 
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#4b5563' }}>Databases</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['MySQL', 'MongoDB'].map((skill) => (
                <span key={skill} style={{ 
                  backgroundColor: '#e5e7eb', 
                  color: '#1f2937', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.875rem' 
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#4b5563' }}>Tools & Platforms</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Git', 'VS Code', 'Windows', 'Node.js', 'SFML', 'Steamworks SDK'].map((skill) => (
                <span key={skill} style={{ 
                  backgroundColor: '#e5e7eb', 
                  color: '#1f2937', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.875rem' 
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>Featured Projects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2563eb' }}>Dark and Darker Tracker</h3>
            <p style={{ color: '#4b5563', marginBottom: '0.75rem' }}>Interactive map for Dark and Darker with dynamic item filtering and automated game data updates.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
              {['React.js', 'PixiJS', 'Python', 'Node.js'].map((tech) => (
                <span key={tech} style={{ 
                  backgroundColor: '#f3f4f6', 
                  color: '#1f2937', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem', 
                  fontSize: '0.75rem' 
                }}>
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
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2563eb' }}>Vancouver Lighting - Tag Creation</h3>
            <p style={{ color: '#4b5563', marginBottom: '0.75rem' }}>Desktop application that automates tag creation workflow, reducing processing time by over 50%.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
              {['React.js', 'Electron.js', 'Django', 'Python'].map((tech) => (
                <span key={tech} style={{ 
                  backgroundColor: '#f3f4f6', 
                  color: '#1f2937', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem', 
                  fontSize: '0.75rem' 
                }}>
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
  );
}