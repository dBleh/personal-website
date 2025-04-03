import ProjectCard from "../../components/ProjectCard";
import Link from 'next/link';

export default function Projects() {
  return (
    <div style={{ maxWidth: '4xl', margin: '0 auto', marginLeft: '210px' }}>
      <h1 style={{ 
        fontSize: '2.25rem', 
        fontWeight: 'bold', 
        marginBottom: '2rem', 
        color: '#1f2937', 
        borderBottom: '2px solid #3b82f6', 
        paddingBottom: '0.5rem' 
      }}>
        My Projects
      </h1>
      
      <div style={{ marginBottom: '3rem' }}>
        <ProjectCard
          title="Dark and Darker Tracker"
          description="An interactive map for Dark and Darker using React.js and PixiJS with a functional legend that allows users to toggle item categories dynamically. Automated file parsing for each game update using custom Python scripts to read and process game files. This project has helped over 68,000 users navigate the game world more effectively."
          technologies={["React.js", "PixiJS", "Node.js", "Python", "JavaScript"]}
          githubUrl="https://github.com/NoahMacRitchie/dad-helper"
          demoUrl="https://darkanddarkertracker.com"
        />
      </div>
      
      <div style={{ marginBottom: '3rem' }}>
        <ProjectCard
          title="Vancouver Lighting - Tag Creation Automation"
          description="A desktop application built for Vancouver Lighting to automate their tag creation process. Developed using Electron.js and React.js with a Django backend to process PDF files and populate tag data. This tool successfully automated a previously manual workflow, reducing the processing time by over 50% and significantly improving operational efficiency."
          technologies={["React.js", "Electron.js", "Django", "Python", "JavaScript"]}
          githubUrl="https://github.com/dBleh/Van-Tags"
        />
      </div>
      
      <div style={{ marginBottom: '3rem' }}>
        <ProjectCard
          title="Multiplayer Steam Game"
          description="Currently developing a multiplayer 2D game with P2P connections entirely in C++ without a game engine. Implementing custom networking and real-time game mechanics using SFML and Steamworks SDK. This project involves managing game logic, rendering, and multiplayer synchronization from scratch."
          technologies={["C++", "SFML", "Steamworks SDK"]}
          githubUrl="https://github.com/dBleh/CubeGame"
        />
      </div>
      
      <div>
        <ProjectCard
          title="GeoBuild - 3D Building Tool"
          description="A 3D building and construction interface built with Three.js allowing users to place and manipulate objects in a 3D space. Features include object snapping, placement validation, and an intuitive user interface for building virtual structures."
          technologies={["Three.js", "JavaScript", "React.js"]}
          localUrl="/geobuild"
        />
        
      </div>
    </div>
  );
}