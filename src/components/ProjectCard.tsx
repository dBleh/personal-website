import Image from 'next/image';
import Link from 'next/link';

type ProjectCardProps = {
  title: string;
  description: string;
  imageUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  technologies?: string[];
};

export default function ProjectCard({
  title,
  description,
  imageUrl,
  githubUrl,
  demoUrl,
  technologies = [],
}: ProjectCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg shadow-md overflow-hidden bg-white">
      {imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-700 mb-4">{description}</p>

        {technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-4">
          {githubUrl && (
            <Link 
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub
            </Link>
          )}
          {demoUrl && (
            <Link 
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Live Demo
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}