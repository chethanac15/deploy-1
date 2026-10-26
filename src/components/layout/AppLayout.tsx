import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-shell flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
        <TopBar />
        <main className="app-main flex-1 p-3.5 sm:p-5 md:p-7 xl:p-8 mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
