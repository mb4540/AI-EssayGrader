// Layout Component
// Wraps pages with navigation

import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import CreateAssignmentModal from './CreateAssignmentModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  // Listen for assignment modal trigger from navigation
  useEffect(() => {
    const handleOpenModal = () => setIsAssignmentModalOpen(true);
    window.addEventListener('openAssignmentModal', handleOpenModal);
    return () => window.removeEventListener('openAssignmentModal', handleOpenModal);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>{children}</main>
      
      {/* Global Assignment Modal */}
      <CreateAssignmentModal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => setIsAssignmentModalOpen(false)} 
      />
    </div>
  );
}
