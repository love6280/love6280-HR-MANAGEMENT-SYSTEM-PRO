import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const PageWrapper = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar navigation */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main viewport */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'pl-[70px]' : 'pl-[240px]'} transition-all duration-300`}>
        {/* Top Header bar */}
        <Topbar isCollapsed={isCollapsed} />

        {/* Page content view with transitions */}
        <main className="flex-1 pt-20 pb-10 px-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default PageWrapper;
