import React from 'react';

export default function Info() {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: '2.25rem', 
        fontWeight: 'bold', 
        marginBottom: '2rem', 
        color: '#1f2937', 
        borderBottom: '2px solid #3b82f6', 
        paddingBottom: '0.5rem' 
      }}>
        Professional Information
      </h1>
      
    
      
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Education</h2>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            flexWrap: 'wrap' 
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>Computer Science Diploma</h3>
              <p style={{ color: '#111827' }}>Douglas College, New Westminster</p>
            </div>
            <p style={{ color: '#4b5563' }}>Jan 2018 – Dec 2022</p>
          </div>
          <p style={{ marginTop: '1rem', color: '#111827' }}>
            Completed a comprehensive program covering software development, algorithms, data structures, 
            database design.
          </p>
        </div>
      </section>
      
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Professional Experience</h2>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '1.5rem' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            flexWrap: 'wrap',
            marginBottom: '0.5rem' 
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>Sales Associate & Developer</h3>
              <p style={{ color: '#111827' }}>Vancouver Lighting, Coquitlam</p>
            </div>
            <p style={{ color: '#4b5563' }}>Jan 2017 - Present</p>
          </div>
          <ul style={{ paddingLeft: '1.5rem', color: '#111827', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Developed an automation tool to improve operational efficiency, reducing tag processing time by over 50%</li>
            <li style={{ marginBottom: '0.5rem' }}>Assisted customers with technical troubleshooting and product selection</li>
            <li>Balanced technical development work with customer-facing responsibilities</li>
          </ul>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '1.5rem' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            flexWrap: 'wrap',
            marginBottom: '0.5rem' 
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>Lead Tennis Instructor</h3>
              <p style={{ color: '#111827' }}>City of New Westminster</p>
            </div>
            <p style={{ color: '#4b5563' }}>Nov 2020 - Present</p>
          </div>
          <ul style={{ paddingLeft: '1.5rem', color: '#111827', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Designed and led inclusive training programs for various skill levels</li>
            <li style={{ marginBottom: '0.5rem' }}>Provided mentorship and leadership to volunteers</li>
            <li>Developed strong communication skills working with diverse groups</li>
          </ul>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            flexWrap: 'wrap',
            marginBottom: '0.5rem' 
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>Gymnastics Instructor</h3>
              <p style={{ color: '#111827' }}>City of New Westminster</p>
            </div>
            <p style={{ color: '#4b5563' }}>Nov 2015 - 2020</p>
          </div>
          <ul style={{ paddingLeft: '1.5rem', color: '#111827', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Taught gymnastics skills to children of various ages and abilities</li>
            <li style={{ marginBottom: '0.5rem' }}>Ensured safety procedures were followed during all activities</li>
            <li>Developed strong leadership and organizational skills</li>
          </ul>
        </div>
      </section>
      
      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Contact Information</h2>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '1rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:Duncanblais@gmail.com" style={{ color: '#111827', textDecoration: 'none' }}>Duncanblais@gmail.com</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href="tel:672-514-8325" style={{ color: '#111827', textDecoration: 'none' }}>672-514-8325</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <a href="https://github.com/dBleh" target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'none' }}>github.com/dBleh</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}