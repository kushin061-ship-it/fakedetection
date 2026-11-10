import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-tl-bg">
      {/* Sidebar renders desktop sidebar + mobile top bar internally */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 md:ml-[220px] min-h-screen bg-tl-bg px-6 lg:px-10 py-8">
        <div className="max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
