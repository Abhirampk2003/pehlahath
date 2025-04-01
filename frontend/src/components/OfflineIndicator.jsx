import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useThemeStore } from '../store/theme';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
      isDarkMode ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
    }`}>
      <WifiOff size={16} />
      <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
    </div>
  );
}