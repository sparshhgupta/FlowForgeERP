import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Wrench, Users, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Building2 className="text-blue-400" size={32} />
            <h1 className="text-2xl font-bold text-white">Parasnath Build</h1>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Steel & Foundation Bolts<br />
            <span className="text-blue-400">Manufacturing ERP</span>
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Streamline your production workflow, track projects in real-time, 
            and manage your workforce efficiently.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-lg transition-colors shadow-lg"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white text-lg rounded-lg transition-colors"
            >
              Register
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-colors">
            <div className="bg-blue-500 bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Project Tracking</h3>
            <p className="text-slate-400">
              Monitor production progress and completion percentages for all projects in real-time.
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-colors">
            <div className="bg-green-500 bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="text-green-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Workforce Management</h3>
            <p className="text-slate-400">
              Track employee attendance and machine assignments with daily updates.
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-colors">
            <div className="bg-purple-500 bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Wrench className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Production Analytics</h3>
            <p className="text-slate-400">
              Get detailed insights on product manufacturing across different types and units.
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-colors">
            <div className="bg-orange-500 bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="text-orange-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Role-Based Access</h3>
            <p className="text-slate-400">
              Secure access control with owner and supervisor roles for different permissions.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-slate-800 bg-opacity-50 backdrop-blur-sm border border-slate-700 rounded-xl p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">Real-Time</div>
              <div className="text-slate-300">Status Updates</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">24/7</div>
              <div className="text-slate-300">Access</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
              <div className="text-slate-300">Transparency</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border-t border-slate-700 py-8 mt-20">
        <div className="container mx-auto px-6 text-center text-slate-400">
          <p>&copy; 2025 Parasnath Build. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;