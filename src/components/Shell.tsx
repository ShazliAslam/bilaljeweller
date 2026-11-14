import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Shell() {
  return (
    <div className="relative min-h-screen flex" style={{ zIndex: 1 }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto px-6 lg:px-10 py-8">
          <div className="max-w-[1400px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
