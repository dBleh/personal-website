import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <section className="mb-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Profile image placeholder */}
              
              
              <div>
                <h1 className="text-5xl font-bold mb-3 text-gray-800">Duncan Blais</h1>
                <h2 className="text-2xl text-blue-600 mb-4">Full Stack Developer</h2>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <a 
                    href="mailto:Duncanblais@gmail.com" 
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Duncanblais@gmail.com
                  </a>
                  
                  <a 
                    href="tel:672-514-8325" 
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    672-514-8325
                  </a>
                  
                  <a 
                    href="https://github.com/dBleh" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">About Me</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              I'm a Full Stack Developer with experience in building web applications, desktop software, and game development.
              My passion lies in creating efficient solutions that solve real-world problems, whether it's developing interactive maps
              for gamers or automating workflow processes for businesses. With a background in Computer Science and professional
              experience at Vancouver Lighting, I bring both technical skills and practical business understanding to my projects.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">Technical Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">Programming Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {['C++', 'Python', 'JavaScript', 'TypeScript'].map((skill) => (
                    <span key={skill} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">Web Development</h3>
                <div className="flex flex-wrap gap-2">
                  {['React.js', 'Electron.js', 'Django', 'HTML', 'CSS', 'PixiJS'].map((skill) => (
                    <span key={skill} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">Databases</h3>
                <div className="flex flex-wrap gap-2">
                  {['MySQL', 'MongoDB'].map((skill) => (
                    <span key={skill} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">Tools & Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {['Git', 'VS Code', 'Windows', 'Node.js', 'SFML', 'Steamworks SDK'].map((skill) => (
                    <span key={skill} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}