'use client';

import React, { CSSProperties } from 'react';
import useMediaQuery from '../../hooks/useMediaQuery';
import VerticalNavigation from '../../components/VerticalNavigation';

export default function Info() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const navItems = [
    { id: 'education-section', label: 'Education' },
    { id: 'experience-section', label: 'Experience' },
    { id: 'contact-section', label: 'Contact Info' }
  ];

  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        .info-nav-link:hover {
            color: #1d4ed8; /* Tailwind blue-700 */
        }
        .info-card {
            background-color: white;
            padding: 1.5rem;
            border-radius: 0.5rem; /* rounded-lg */
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
            border: 1px solid #e5e7eb; /* border-gray-200 */
            margin-bottom: 1.5rem;
        }
        .section-heading {
             font-size: 1.5rem; /* text-xl */
             font-weight: bold;
             margin-bottom: 1.5rem; /* mb-6 */
             color: #1f2937; /* text-gray-800 */
             /* border-bottom: 2px solid #3b82f6; /* border-blue-500 */ */
             /* padding-bottom: 0.5rem; /* pb-2 */ */
        }
         .job-title {
             font-size: 1.25rem; /* text-lg */
             font-weight: bold;
             color: #1e40af; /* text-blue-800 */
             margin-bottom: 0.25rem; /* mb-1 */
         }
         .company-location {
             color: #111827; /* text-gray-900 */
             margin-bottom: 0.25rem; /* mb-1 */
             font-weight: 500;
         }
          .dates {
             color: #4b5563; /* text-gray-600 */
             flex-shrink: 0;
             font-size: 0.9rem; /* Slightly smaller */
          }
          .description-list {
            padding-left: 1.25rem; /* pl-5 */
            color: #374151; /* text-gray-700 */
            list-style-type: disc;
            line-height: 1.6; /* leading-relaxed */
            margin-top: 1rem; /* mt-4 */
          }
          .description-list li {
            margin-bottom: 0.5rem; /* mb-2 */
          }

      `}</style>

     {!isMobile && (
          <VerticalNavigation items={navItems} />
      )}

      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{
          fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem',
          color: '#1f2937', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem'
        }}>
          Education & Experience
        </h1>

       
        <section id="education-section" style={{ marginBottom: '3rem' }}>
          <h2 className="section-heading">Education</h2>
          <div className="info-card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="job-title">Computer Science Diploma</h3>
                <p className="company-location">Douglas College, New Westminster, BC</p>
              </div>
              <p className="dates">Jan 2018 – Dec 2022</p>
            </div>
            
            
            <h4 style={{ fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', color: '#374151' }}>Relevant Coursework:</h4>
            <ul style={{ paddingLeft: '1.25rem', color: '#374151', listStyleType: 'disc', lineHeight: 1.6, margin: 0 }}>
                <li>Data Structures & Algorithms</li>
                <li>User Interface Design</li>
                <li>Computer Graphics</li>
             
            </ul>
          </div>
        </section>

       
        <section id="experience-section" style={{ marginBottom: '3rem' }}>
          <h2 className="section-heading">Professional Experience</h2>

         
          <div className="info-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="job-title">Sales Associate & Developer</h3>
                <p className="company-location">Vancouver Lighting, Coquitlam, BC</p>
              </div>
              <p className="dates">Jan 2017 - Present</p>
            </div>
            <ul className="description-list">
              <li>Spearheaded the development of an internal automation tool using Python, Django, Electron.js, and React.js to streamline tag creation from PDF files, reducing processing time by over 50%.</li>
              <li>Successfully balanced technical development responsibilities with customer-facing sales and support duties.</li>
              <li>Contributed to improving operational efficiency through proactive identification of workflow bottlenecks and proposing software solutions.</li>
            </ul>
          </div>

         
          <div className="info-card">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <h3 className="job-title">Tennis Instructor</h3>
                 <p className="company-location">City of New Westminster - Parks and Recreation, New Westminster, BC</p>
              </div>
              <p className="dates">Nov 2020 - Present</p>
            </div>
            <ul className="description-list" style={{ marginTop: 0 }}>
              <li>Designed, planned, and delivered engaging and inclusive tennis training programs for diverse age groups and skill levels.</li>
              <li>Provided leadership, mentorship, and guidance to assistant instructors and volunteers.</li>
              <li>Fostered a positive and safe learning environment, emphasizing sportsmanship and skill development.</li>
               <li>Developed strong communication, organizational, and interpersonal skills through regular interaction with participants, parents, and city staff.</li>
            </ul>

           
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginTop:'1.5rem', marginBottom: '1rem' }}>
              <div>
                <h3 className="job-title" style={{fontSize: '1.1rem'}}>Gymnastics Instructor</h3> 
                <p className="company-location" style={{ fontStyle: 'italic' }}>Previously at City of New Westminster</p>
              </div>
              <p className="dates">Nov 2015 - Nov 2020</p>
            </div>
            <ul className="description-list" style={{ marginTop: 0 }}>
              <li>Instructed fundamental gymnastics skills to children aged 3-19, adapting techniques for various abilities.</li>
              <li>Ensured strict adherence to safety protocols and equipment checks during all classes and activities.</li>
               <li>Cultivated patience, clear communication, and motivational techniques suitable for young learners.</li>
               <li>Managed class schedules, participant registration, and progress tracking.</li>
            </ul>
          </div>
        </section>

       
        <section id="contact-section" style={{ marginBottom: '3rem' }}>
          <h2 className="section-heading">Contact Information</h2>
          <div className="info-card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}> 
            
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a href="mailto:Duncanblais@gmail.com" style={{ color: '#111827', textDecoration: 'none', wordBreak: 'break-all', fontWeight: 500 }}>Duncanblais@gmail.com</a>
              </div>
         
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1e40af" style={{ flexShrink: 0 }}> 
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                <a href="https://github.com/dBleh" target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'none', wordBreak: 'break-all', fontWeight: 500 }}>github.com/dBleh</a>
              </div>
               
            </div>
             <p style={{marginTop: '1.5rem', color: '#4b5563', fontSize:'0.9rem'}}>Feel free to reach out via email for inquiries.</p>
          </div>
        </section>
      </div>
    </>
  );
}