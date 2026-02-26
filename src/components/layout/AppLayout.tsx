import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-navy-950/80 backdrop-blur-md border-b border-navy-800/30">
          <div className="flex items-center h-14 px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-navy-800/60 text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
