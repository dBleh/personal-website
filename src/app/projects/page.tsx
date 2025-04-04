'use client';

import React from 'react';
import ProjectCard from "../../components/ProjectCard";
import useMediaQuery from '../../hooks/useMediaQuery'; 

export default function Projects() {

  const isMobile = useMediaQuery('(max-width: 768px)'); 

  const handleGeoBuildNotice = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    alert('GeoBuild is best experienced on a desktop computer.');
  };

  return (

    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '2rem',
        color: '#1f2937',
        borderBottom: '2px solid #3b82f6',
        paddingBottom: '1rem'
      }}>
        My Projects
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>

        <ProjectCard
          title="Dark and Darker Tracker"
          description="An interactive map for Dark and Darker using React.js and PixiJS with a functional legend that allows users to toggle item categories dynamically. Automated file parsing for each game update using custom Python scripts to read and process game files. This project has helped over 68,000 users navigate the game world more effectively."
          technologies={["React.js", "PixiJS", "Node.js", "Python", "JavaScript"]}
          demoUrl="https://darkanddarkertracker.com"
        />

        <ProjectCard
          title="Vancouver Lighting - Tag Creation Automation"
          description="A desktop application built for Vancouver Lighting to automate their tag creation process. Developed using Electron.js and React.js with a Django backend to process PDF files and populate tag data. This tool successfully automated a previously manual workflow, reducing the processing time by over 50% and significantly improving operational efficiency."
          technologies={["React.js", "Electron.js", "Django", "Python", "JavaScript"]}
          githubUrl="https://github.com/dBleh/Van-Tags"
        />

        <ProjectCard
          title="Multiplayer Steam Game"
          description="Currently developing a multiplayer 2D game with P2P connections entirely in C++ without a game engine. Implementing custom networking and real-time game mechanics using SFML and Steamworks SDK. This project involves managing game logic, rendering, and multiplayer synchronization from scratch."
          technologies={["C++", "SFML", "Steamworks SDK"]}
          githubUrl="https://github.com/dBleh/CubeGame"
        />

        <ProjectCard
          title="GeoBuild - 3D Building Tool"
          description="A 3D building and construction interface built with Three.js allowing users to place and manipulate objects in a 3D space. Features include object snapping, placement validation, and an intuitive user interface for building virtual structures."
          technologies={["Three.js", "JavaScript", "React.js"]}
          {...(isMobile
              ? { onClick: handleGeoBuildNotice, actionText: "Desktop Only" } 
              : { localUrl: "/geobuild", actionText: "View Tool" }            
          )}
        />
      </div>
    </div>
  );
}