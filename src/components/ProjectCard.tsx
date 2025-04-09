'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProjectModal from './ProjectModal';

type ProjectCardProps = {
  title: string;
  description: string;
  imageUrl?: string; 
  githubUrl?: string;
  demoUrl?: string;
  localUrl?: string;
  videoUrl?: string; 
  technologies?: string[];
  onCardClickOverride?: (e: React.MouseEvent) => void; 
  actionTextOverride?: string; 
};

export default function ProjectCard({
  title,
  description,
  imageUrl,
  githubUrl,
  demoUrl,
  localUrl,
  videoUrl, 
  technologies = [],
  onCardClickOverride,
  actionTextOverride,
}: ProjectCardProps) {

  const [isModalOpen, setIsModalOpen] = useState(false);


  const handleCardClick = (e: React.MouseEvent) => {
    if (onCardClickOverride) {
      onCardClickOverride(e);
    } else {
      let targetElement = e.target as HTMLElement;
      while (targetElement && targetElement !== e.currentTarget) {
          if (targetElement.tagName === 'A') {
              return; 
          }
          targetElement = targetElement.parentElement as HTMLElement;
      }
      setIsModalOpen(true);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

   const actionText = actionTextOverride
     ? actionTextOverride
     : localUrl ? 'View Project' : demoUrl ? 'Live Demo' : githubUrl ? 'View on GitHub' : 'Details'; 


  return (
    <>
      <div
        style={{
          display: 'flex', flexDirection: 'column', 
          border: '1px solid #e5e7eb', borderRadius: '0.75rem', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)', 
          overflow: 'hidden', backgroundColor: 'white',
          cursor: onCardClickOverride ? 'default' : 'pointer', 
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          height: '100%' 
        }}
        onClick={handleCardClick} 
        onMouseEnter={(e) => {
      
          if (!onCardClickOverride) {
             e.currentTarget.style.transform = 'translateY(-4px)';
             e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.07)';
          }
        }}
        onMouseLeave={(e) => {
          if (!onCardClickOverride) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
          }
        }}
      >
       {imageUrl && (
        <div style={{ position: 'relative', height: '12rem', width: '100%', flexShrink: 0, backgroundColor: '#f9fafb' }}>
          <Image
            src={imageUrl}
            alt={`${title} preview`} 
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
            quality={75} 
            priority={false} 
          />
        </div>
      )}

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}> 
          <h3 style={{
            fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem',
            color: '#111827'
          }}>
            {title}
          </h3>
           <p style={{
            color: '#374151', 
            marginBottom: '1rem', lineHeight: '1.6',
            flexGrow: 1, 

          }}>
          
            {description.substring(0, 150)}{description.length > 150 ? '...' : ''}
          </p>


          {technologies.length > 0 && (
            <div style={{ marginBottom: '1rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {technologies.map((tech, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#f3f4f6', color: '#374151', fontSize: '0.75rem',
                      padding: '0.25rem 0.6rem', borderRadius: '9999px', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div
            style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}
            onClick={handleLinkClick} 
          >
             {onCardClickOverride ? (
                 <span style={{ color: '#4b5563', fontWeight: '500', fontSize: '0.9rem' }}>
                     {actionText}
                 </span>
             ) : (
                 <>
                    {githubUrl && (
                        <Link href={githubUrl} target="_blank" rel="noopener noreferrer" style={cardLinkStyle} onClick={handleLinkClick}>
                        GitHub
                        </Link>
                    )}
                    {demoUrl && (
                        <Link href={demoUrl} target="_blank" rel="noopener noreferrer" style={cardLinkStyle} onClick={handleLinkClick}>
                        Live Demo
                        </Link>
                    )}
                    {localUrl && (
                        <Link href={localUrl} style={cardLinkStyle} onClick={handleLinkClick}>
                        View Project
                        </Link>
                    )}
                    {!githubUrl && !demoUrl && !localUrl && (
                        <span style={cardLinkStyle}>Details</span> 
                    )}
                 </>
             )}
          </div>
        </div>
      </div>

       {!onCardClickOverride && (
            <ProjectModal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={title}
                description={description}
                imageUrl={imageUrl}
                githubUrl={githubUrl}
                demoUrl={demoUrl}
                localUrl={localUrl}
                technologies={technologies}
                videoUrl={videoUrl} 
            />
       )}
    </>
  );
}


const cardLinkStyle: React.CSSProperties = {
  color: '#2563eb', 
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '0.9rem',
};