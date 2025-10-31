import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Database, Cloud, Zap } from 'lucide-react';

interface HealthStatus {
  database: 'checking' | 'connected' | 'error';
  netlify: 'checking' | 'connected' | 'error';
  message?: string;
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthStatus>({
    database: 'checking',
    netlify: 'checking',
  });

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health-check');
      const data = await response.json();
      
      if (response.ok && (data.status === 'ok' || data.status === 'healthy')) {
        setHealth({
          database: 'connected',
          netlify: 'connected',
          message: data.message || 'All systems operational',
        });
      } else {
        setHealth({
          database: 'error',
          netlify: 'connected',
          message: data.message || data.error || 'Health check failed',
        });
      }
    } catch (error) {
      setHealth({
        database: 'error',
        netlify: 'error',
        message: 'Failed to connect to backend',
      });
    }
  };

  const StatusIcon = ({ status }: { status: 'checking' | 'connected' | 'error' }) => {
    if (status === 'checking') return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    if (status === 'connected') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FastAI Grader</h1>
                <p className="text-sm text-gray-500">AI-Powered Essay Grading Assistant</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to FastAI Grader
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered assistant for grading 6th-grade essays with speed and precision.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Netlify Status */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Cloud className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Netlify Functions</h3>
              </div>
              <StatusIcon status={health.netlify} />
            </div>
            <p className="text-gray-600">
              {health.netlify === 'checking' && 'Checking connection...'}
              {health.netlify === 'connected' && 'Serverless functions are running'}
              {health.netlify === 'error' && 'Unable to connect to functions'}
            </p>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Neon Database</h3>
              </div>
              <StatusIcon status={health.database} />
            </div>
            <p className="text-gray-600">
              {health.database === 'checking' && 'Checking connection...'}
              {health.database === 'connected' && 'Database is connected and ready'}
              {health.database === 'error' && 'Database connection failed'}
            </p>
          </div>
        </div>

        {/* Message Display */}
        {health.message && (
          <div className={`rounded-lg p-4 mb-8 ${
            health.database === 'connected' && health.netlify === 'connected'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              health.database === 'connected' && health.netlify === 'connected'
                ? 'text-green-800'
                : 'text-red-800'
            }`}>
              {health.message}
            </p>
          </div>
        )}

        {/* Features Grid */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📝</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Multiple Input Methods</h4>
              <p className="text-sm text-gray-600">Upload handwritten photos, DOCX files, or paste plain text</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Grading</h4>
              <p className="text-sm text-gray-600">Get instant feedback on grammar, structure, and content</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✏️</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Teacher Override</h4>
              <p className="text-sm text-gray-600">Edit AI suggestions with full version history</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-blue-50 mb-6">
            Once your database is fully configured, you'll be able to start grading essays with AI assistance.
          </p>
          <button
            onClick={checkHealth}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Recheck Connection
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            FastAI Grader - AI-Powered Essay Grading for Educators
          </p>
        </div>
      </footer>
    </div>
  );
}
