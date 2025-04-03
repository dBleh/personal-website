import Image from 'next/image';
import Link from 'next/link';

type ProjectCardProps = {
  title: string;
  description: string;
  imageUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  localUrl?: string;
  technologies?: string[];
};

export default function ProjectCard({
  title,
  description,
  imageUrl,
  githubUrl,
  demoUrl,
  localUrl,
  technologies = [],
}: ProjectCardProps) {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      backgroundColor: 'white'
    }}>
      {imageUrl && (
        <div style={{ position: 'relative', height: '12rem', width: '100%' }}>
          <Image
            src={imageUrl}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          color: '#111827'
        }}>
          {title}
        </h3>
        
        <p style={{ 
          color: '#111827', 
          marginBottom: '1rem',
          lineHeight: '1.5'
        }}>
          {description}
        </p>

        {technologies.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem' 
            }}>
              {technologies.map((tech, index) => (
                <span 
                  key={index}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#111827',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '1rem' 
        }}>
          {githubUrl && (
            <Link 
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: '500'
              }}
              
            >
              GitHub
            </Link>
          )}
          
          {demoUrl && (
            <Link 
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: '500'
              }}
          
            >
              Live Demo
            </Link>
          )}
          {localUrl && (
            <Link
            href={localUrl}
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              GeoBuild
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}