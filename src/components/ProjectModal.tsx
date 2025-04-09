'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  imageUrl?: string; 
  videoUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  localUrl?: string;
  technologies?: string[];
};

export default function ProjectModal({
  isOpen,
  onClose,
  title,
  description,
  imageUrl, 
  videoUrl,
  githubUrl,
  demoUrl,
  localUrl,
  technologies = [],
}: ProjectModalProps) {

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.75)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000, padding: '1rem', 
        boxSizing: 'border-box',
      }}
      onClick={onClose} 
    >
      <div
        style={{
          position: 'relative', backgroundColor: 'white',
          padding: '2rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%', 
          maxWidth: '60rem', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          color: '#111827',
        }}
        onClick={handleContentClick} 
      >
       
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '0.75rem', 
            right: '0.75rem',
            background: 'none', border: 'none',
            fontSize: '1.75rem', lineHeight: '1', cursor: 'pointer',
            color: '#6b7280', 
            padding: '0.5rem', 
            zIndex: 10 
          }}
        >
          × 
        </button>

        <h2 style={{
          fontSize: '1.875rem', fontWeight: 'bold',
          marginBottom: '1.5rem',
          marginTop: '0', paddingRight: '3rem' 
        }}>
          {title}
        </h2>
        {videoUrl && (
          <div style={{
            width: '100%', marginBottom: '1.5rem', borderRadius: '0.375rem',
            overflow: 'hidden', backgroundColor: '#000', aspectRatio: '16 / 9'
          }}>
            <video
              controls
              width="100%"
              style={{ display: 'block', width: '100%', height: 'auto' }}
              preload="metadata"
              src={videoUrl}
              poster={imageUrl} 
              playsInline 
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {!videoUrl && imageUrl && (
          <div style={{
            position: 'relative', width: '100%', paddingTop: '56.25%', 
            marginBottom: '1.5rem', borderRadius: '0.375rem', overflow: 'hidden',
            backgroundColor: '#f3f4f6' 
           }}>
            <Image
              src={imageUrl}
              alt={`Screenshot of ${title}`} 
              fill
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 1024px) 80vw, 50vw" 
            />
          </div>
        )}

        <p style={{ marginBottom: '1.5rem', lineHeight: '1.7' }}> 
          {description}
        </p>

        {technologies.length > 0 && (
          <div style={{ marginBottom: '2rem' }}> 
            <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>Technologies Used:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}> 
              {technologies.map((tech, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: '#e5e7eb', color: '#1f2937', fontSize: '0.875rem',
                    padding: '0.375rem 0.75rem', borderRadius: '9999px' 
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {(githubUrl || demoUrl || localUrl) && ( 
          <div style={{
            display: 'flex', flexWrap: 'wrap', 
            gap: '1.5rem', marginTop: '1.5rem',
            borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem'
          }}>
            {githubUrl && (
                <Link href={githubUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                View on GitHub <span aria-hidden="true">→</span>
                </Link>
            )}
            {demoUrl && (
                <Link href={demoUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                Live Demo <span aria-hidden="true">→</span>
                </Link>
            )}
            {localUrl && (
                <Link href={localUrl} style={linkStyle}>
                 View Project <span aria-hidden="true">→</span>
                </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  color: '#1d4ed8', 
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '1rem',
  display: 'inline-flex', 
  alignItems: 'center',
  gap: '0.25rem'
};