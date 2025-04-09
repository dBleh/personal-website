'use client';

import React from 'react';
import ProjectCard from "../../components/ProjectCard"; 
import useMediaQuery from '../../hooks/useMediaQuery'; 

export default function Projects() {

  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleGeoBuildNotice = (e: React.MouseEvent) => {
    e.preventDefault(); 
    alert('GeoBuild is optimized for desktop use. Please view on a larger screen for the best experience.');
  };

  return (
    
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1rem 4rem 1rem', minHeight: 'calc(100vh - 8rem)' }}> 
      <h1 style={{
        fontSize: '2.25rem', 
        fontWeight: 'bold',
        marginBottom: '2.5rem', 
        color: '#1f2937',
        borderBottom: '2px solid #3b82f6',
        paddingBottom: '0.75rem' 
      }}>
        My Projects
      </h1>

    
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

        <ProjectCard
          title="Dark and Darker Tracker"
          description="Developed an interactive web map for the game Dark and Darker using React.js and PixiJS. Features dynamic item filtering via a functional legend and automated game file parsing with Python scripts for seamless updates. Proudly supported over 68,000 users in navigating the game's dungeons."
          technologies={["React.js", "PixiJS", "Node.js", "Python", "JavaScript", "HTML/CSS"]}
       
          imageUrl="/images/darkanddarker.png" 
          videoUrl="/videos/DarkVid.mp4" 
          demoUrl="https://darkanddarkertracker.com"
        />

        <ProjectCard
          title="Vancouver Lighting - Tag Creation Automation"
          description="Engineered a cross-platform desktop application (Electron.js/React.js) with a Python/Django backend for Vancouver Lighting. This tool automates the creation of product tags directly from PDF files, drastically reducing manual processing time by over 50% and significantly boosting operational efficiency."
          technologies={["React.js", "Electron.js", "Django", "Python", "JavaScript", "CSS"]}
           
          imageUrl="/images/vantags.png" 
          githubUrl="https://github.com/dBleh/Van-Tags"
        />

        <ProjectCard
          title="Multiplayer Steam Game (In Development)"
          description="Building a 2D peer-to-peer multiplayer game from the ground up in C++, intentionally avoiding commercial game engines. Implementing custom networking (using Steamworks SDK P2P), rendering (with SFML), and state synchronization logic from scratch. A deep dive into low-level game development challenges."
          technologies={["C++", "SFML", "Steamworks SDK", "Networking", "Game Logic"]}
          
          imageUrl="/images/cuboid.png" 
          githubUrl="https://github.com/dBleh/CubeGame"
        />

        <ProjectCard
          title="GeoBuild - 3D Web Construction Tool"
          description="Created a web-based 3D construction interface using Three.js and React. Allows users to intuitively place, manipulate, and snap virtual objects within a 3D environment. Features include placement validation logic and a user-friendly interface designed for building virtual structures directly in the browser."
          technologies={["Three.js", "React.js", "JavaScript", "HTML/CSS"]}
          
          imageUrl="/images/geobuild.png"
          
          {...(isMobile
             
              ? { onCardClickOverride: handleGeoBuildNotice, actionTextOverride: "Desktop Recommended" } 
             
              : { localUrl: "/geobuild" } 
          )}
        />
      </div>
    </div>
  );
}