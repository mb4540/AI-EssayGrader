/**
 * DashboardStats Component
 * 
 * Displays key statistics in a card grid
 */

import { FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { DashboardStats as Stats } from '../hooks/useDashboardStats';

interface DashboardStatsProps {
  stats: Stats;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
};

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const {
    totalSubmissions,
    averageAiGrade,
    averageTeacherGrade,
    pendingReview,
    gradedToday,
  } = stats;

  // Format average grades
  const aiGradeDisplay = averageAiGrade !== null ? `${averageAiGrade}%` : 'N/A';
  const teacherGradeDisplay = averageTeacherGrade !== null ? `${averageTeacherGrade}%` : 'N/A';
  
  // Calculate percentage pending
  const pendingPercent = totalSubmissions > 0 
    ? Math.round((pendingReview / totalSubmissions) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<FileText className="w-5 h-5" />}
        label="Total Submissions"
        value={totalSubmissions}
        color="blue"
      />
      
      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        label="Average Grades"
        value={teacherGradeDisplay}
        subtext={`AI: ${aiGradeDisplay}`}
        color="green"
      />
      
      <StatCard
        icon={<Clock className="w-5 h-5" />}
        label="Pending Review"
        value={pendingReview}
        subtext={`${pendingPercent}% of total`}
        color="yellow"
      />
      
      <StatCard
        icon={<CheckCircle className="w-5 h-5" />}
        label="Graded Today"
        value={gradedToday}
        color="purple"
      />
    </div>
  );
}
