import ProjectCard from "@/components/ProjectCard";
import Sidebar from "@/components/Sidebar";

export default function Projects() {
  return (
    <div className="flex min-h-screen">

      
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-800 border-b-2 border-blue-500 pb-2">My Projects</h1>
          
          <div className="grid gap-8 mb-12">
            <ProjectCard
              title="Dark and Darker Tracker"
              description="An interactive map for Dark and Darker using React.js and PixiJS with a functional legend that allows users to toggle item categories dynamically. Automated file parsing for each game update using custom Python scripts to read and process game files. This project has helped over 68,000 users navigate the game world more effectively."
              //imageUrl="/api/placeholder/800/400"
              technologies={["React.js", "PixiJS", "Node.js", "Python", "JavaScript"]}
              githubUrl="https://github.com/NoahMacRitchie/dad-helper"
              demoUrl="https://darkanddarkertracker.com"
            />
          </div>
          
          <div className="grid gap-8 mb-12">
            <ProjectCard
              title="Vancouver Lighting - Tag Creation Automation"
              description="A desktop application built for Vancouver Lighting to automate their tag creation process. Developed using Electron.js and React.js with a Django backend to process PDF files and populate tag data. This tool successfully automated a previously manual workflow, reducing the processing time by over 50% and significantly improving operational efficiency."
              //imageUrl="/api/placeholder/800/400"
              technologies={["React.js", "Electron.js", "Django", "Python", "JavaScript"]}
              githubUrl="https://github.com/dBleh/Van-Tags"
            />
          </div>
          
          <div className="grid gap-8 mb-12">
            <ProjectCard
              title="Multiplayer Steam Game"
              description="Currently developing a multiplayer 2D game with P2P connections entirely in C++ without a game engine. Implementing custom networking and real-time game mechanics using SFML and Steamworks SDK. This project involves managing game logic, rendering, and multiplayer synchronization from scratch."
              //imageUrl="/api/placeholder/800/400"
              technologies={["C++", "SFML", "Steamworks SDK"]}
              githubUrl="https://github.com/dBleh/CubeGame"
            />
          </div>
          
          <div className="grid gap-8">
            <ProjectCard
              title="GeoBuild - 3D Building Tool"
              description="A 3D building and construction interface built with Three.js allowing users to place and manipulate objects in a 3D space. Features include object snapping, placement validation, and an intuitive user interface for building virtual structures."
              //imageUrl="/api/placeholder/800/400"
              technologies={["Three.js", "JavaScript", "React.js"]}
              demoUrl="/geobuild"
            />
          </div>
        </div>
      </main>
    </div>
  );
}