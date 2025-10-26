// Student Selector - Bridge-integrated component for selecting students
// Resolves student names to UUIDs locally without sending PII to cloud

import { useState, useEffect } from 'react';
import { useBridge } from '../hooks/useBridge';
import { Search, User, AlertCircle } from 'lucide-react';
import { BridgeEntry } from '../bridge/bridgeTypes';

interface StudentSelectorProps {
  value: string; // UUID
  onChange: (uuid: string, studentInfo?: { name: string; localId: string }) => void;
  error?: string;
}

export default function StudentSelector({ value, onChange, error }: StudentSelectorProps) {
  const bridge = useBridge();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<BridgeEntry[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<BridgeEntry | null>(null);

  // Load selected student info when value changes
  useEffect(() => {
    if (value && !bridge.isLocked) {
      const student = bridge.findByUuid(value);
      setSelectedStudent(student);
      if (student) {
        setSearchTerm(`${student.name} (${student.localId})`);
      }
    }
  }, [value, bridge]);

  // Filter students based on search term
  useEffect(() => {
    if (!bridge.isLocked && searchTerm && showDropdown) {
      const term = searchTerm.toLowerCase();
      const filtered = bridge.students.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.localId.toLowerCase().includes(term)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(bridge.students);
    }
  }, [searchTerm, bridge.students, bridge.isLocked, showDropdown]);

  const handleSelect = (student: BridgeEntry) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.name} (${student.localId})`);
    setShowDropdown(false);
    onChange(student.uuid, { name: student.name, localId: student.localId });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSelectedStudent(null);
      onChange('');
    }
  };

  // If bridge is locked, show warning
  if (bridge.isLocked) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Student *
        </label>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Bridge Locked</p>
              <p className="text-sm text-yellow-700 mt-1">
                Please unlock your student bridge to select a student. The bridge keeps
                student names private and local to your device.
              </p>
              <button
                onClick={() => window.location.href = '/bridge'}
                className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
              >
                Go to Bridge Manager
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no students in bridge
  if (bridge.students.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Student *
        </label>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">No Students Yet</p>
              <p className="text-sm text-blue-700 mt-1">
                Add students to your bridge before creating submissions.
              </p>
              <button
                onClick={() => window.location.href = '/bridge'}
                className="mt-2 text-sm text-blue-800 underline hover:text-blue-900"
              >
                Add Students
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      <label className="block text-sm font-medium text-gray-700">
        Student *
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Search by name or ID..."
          required
        />

        {selectedStudent && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && filteredStudents.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredStudents.map((student) => (
            <button
              key={student.uuid}
              type="button"
              onClick={() => handleSelect(student)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
            >
              <div className="font-medium text-gray-900">{student.name}</div>
              <div className="text-sm text-gray-500">ID: {student.localId}</div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && searchTerm && filteredStudents.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
          No students found matching "{searchTerm}"
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {selectedStudent && (
        <div className="text-xs text-gray-500">
          UUID: {selectedStudent.uuid.slice(0, 8)}... (never sent with name)
        </div>
      )}
    </div>
  );
}
