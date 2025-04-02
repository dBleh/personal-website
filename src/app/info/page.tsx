import React from 'react';
import Sidebar from "@/components/Sidebar";

export default function Info() {
  return (
    <div className="flex min-h-screen">
      
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-800 border-b-2 border-blue-500 pb-2">Professional Information</h1>
          
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">About Me</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              I'm Duncan Blais, a Full Stack Developer with expertise in web application development, desktop software, and game development.
              I specialize in creating efficient technical solutions that solve real-world problems, combining strong programming skills with
              practical business understanding.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              With a Computer Science diploma from Douglas College and professional experience at Vancouver Lighting,
              I've developed a diverse skill set that allows me to tackle complex challenges across different platforms and technologies.
            </p>
          </section>
          
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Education</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h3 className="text-xl font-bold text-blue-600">Computer Science Diploma</h3>
                  <p className="text-gray-700">Douglas College, New Westminster</p>
                </div>
                <p className="text-gray-600">Jan 2018 – Dec 2022</p>
              </div>
              <p className="mt-4 text-gray-700">
                Completed a comprehensive program covering software development, algorithms, data structures, 
                database design, and web technologies.
              </p>
            </div>
          </section>
          
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Professional Experience</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-start flex-wrap mb-2">
                <div>
                  <h3 className="text-xl font-bold text-blue-600">Sales Associate & Developer</h3>
                  <p className="text-gray-700">Vancouver Lighting, Coquitlam</p>
                </div>
                <p className="text-gray-600">Jan 2017 - Present</p>
              </div>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Developed an automation tool to improve operational efficiency, reducing tag processing time by over 50%</li>
                <li>Assisted customers with technical troubleshooting and product selection</li>
                <li>Balanced technical development work with customer-facing responsibilities</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-start flex-wrap mb-2">
                <div>
                  <h3 className="text-xl font-bold text-blue-600">Lead Tennis Instructor</h3>
                  <p className="text-gray-700">City of New Westminster</p>
                </div>
                <p className="text-gray-600">Nov 2020 - Present</p>
              </div>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Designed and led inclusive training programs for various skill levels</li>
                <li>Provided mentorship and leadership to volunteers</li>
                <li>Developed strong communication skills working with diverse groups</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start flex-wrap mb-2">
                <div>
                  <h3 className="text-xl font-bold text-blue-600">Gymnastics Instructor</h3>
                  <p className="text-gray-700">City of New Westminster</p>
                </div>
                <p className="text-gray-600">Nov 2015 - 2020</p>
              </div>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Taught gymnastics skills to children of various ages and abilities</li>
                <li>Ensured safety procedures were followed during all activities</li>
                <li>Developed strong leadership and organizational skills</li>
              </ul>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Contact Information</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:Duncanblais@gmail.com" className="text-gray-700 hover:text-blue-600">Duncanblais@gmail.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:672-514-8325" className="text-gray-700 hover:text-blue-600">672-514-8325</a>
                </div>
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <a href="https://github.com/dBleh" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-600">github.com/dBleh</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}