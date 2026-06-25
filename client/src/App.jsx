import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="relative min-h-screen">
          {/* Glowing Background Mesh Orbs */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            {/* Top Left Neon Cyan/Blue Orb */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#4f9eff]/12 to-[#00f2fe]/4 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
            {/* Bottom Right Violet/Magenta Orb */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#8b5cf6]/12 to-[#d946ef]/4 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
            {/* Center Glow */}
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-[#4f9eff]/[0.02] blur-[120px]" />
          </div>
          <AppRoutes />
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 20, 40, 0.9)',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
