import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="w-64 h-full bg-gray-800 text-white p-6">
      <div className="mb-8">
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          Home
        </Link>
      </div>
      <nav>
        <ul className="space-y-4">
          <li>
            <Link href="/info" className="block hover:text-gray-300">
              Info
            </Link>
          </li>
          <li>
            <Link href="/projects" className="block hover:text-gray-300">
              Projects
            </Link>
          </li>
          <li>
            <Link href="/geobuild" className="block hover:text-gray-300">
              GeoBuild
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}