// PageHeader Component
// Reusable page header with title, icon, and quick-access action buttons
// Design Philosophy: Speed First - Put critical actions where teachers need them

import { Plus, Lock, Unlock } from 'lucide-react';
import { Button } from './ui/button';
import { useBridge } from '../hooks/useBridge';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showAddAssignment?: boolean;
  showBridgeLock?: boolean;
}

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  showAddAssignment = false,
  showBridgeLock = false,
}: PageHeaderProps) {
  const { isLocked } = useBridge();

  const handleAddAssignment = () => {
    const event = new CustomEvent('openAssignmentModal');
    window.dispatchEvent(event);
  };

  const handleBridgeToggle = () => {
    // Navigate to bridge page
    window.location.href = '/bridge';
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3">
            <div className="text-gray-700">{icon}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Add Assignment Button */}
            {showAddAssignment && (
              <Button
                onClick={handleAddAssignment}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Assignment
              </Button>
            )}

            {/* Bridge Lock/Unlock Button */}
            {showBridgeLock && (
              <Button
                onClick={handleBridgeToggle}
                variant="outline"
                className={`border-2 ${
                  isLocked
                    ? 'border-red-500 text-red-600 hover:bg-red-50'
                    : 'border-green-500 text-green-600 hover:bg-green-50'
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Unlock Students
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Lock Students
                  </>
                )}
              </Button>
            )}

            {/* Custom Actions */}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
