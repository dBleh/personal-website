'use client';
import useIsMobile from '../../hooks/usIsMobile';
export default function GeoBuildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile()
  return (
    <div className="w-full h-full">
      {isMobile?"Geobuild is not supported on mobile":children}
    </div>
  );
}