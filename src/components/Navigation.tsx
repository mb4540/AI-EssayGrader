// Navigation Component
// Top navigation bar with user menu and logout

import { Link } from 'react-router-dom';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import SettingsModal from './SettingsModal';

export default function Navigation() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  return (
    <header>
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <img 
                src="/GoTIcon.png" 
                alt="Gift of Time" 
                className="w-10 h-10"
              />
              <Link to="/" className="ml-3">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  EssayEase by Gift of Time
                </h1>
                <h2 className="text-xs text-gray-600 leading-tight">
                  Take the pain out of essay grading.
                </h2>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/submission"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Grade
              </Link>
              <Link
                to="/bridge"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Students
              </Link>
              <Link
                to="/help"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Help
              </Link>

              {/* Settings Icon */}
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-700 hover:text-blue-600 p-2 rounded-md transition-colors"
                title="AI Prompt Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>{user?.full_name || 'User'}</span>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role}</p>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </header>
  );
}
