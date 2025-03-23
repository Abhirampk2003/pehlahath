import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, Phone, AlertCircle, Box, Settings, Heart, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { useThemeStore } from '../store/theme';

export function Sidebar({ isSidebarOpen, setSidebarOpen }) {
  const { logout } = useAuth();
  const { isDarkMode } = useThemeStore();

  const sidebarItems = [
    { icon: <Box size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Bell size={20} />, label: 'Alerts', path: '/alerts' },
    { icon: <MessageSquare size={20} />, label: 'Chat', path: '/chat' },
    { icon: <Phone size={20} />, label: 'Emergency Contacts', path: '/emergency-contacts' },
    { icon: <AlertCircle size={20} />, label: 'Report Disaster', path: '/report-disaster' },
    { icon: <Box size={20} />, label: 'Resources', path: '/resources' },
    { icon: <Heart size={20} />, label: 'Volunteers', path: '/volunteers' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className={`fixed top-0 left-0 h-full shadow-lg transition-all duration-300 z-50 
      ${isSidebarOpen ? 'w-64' : 'w-18'}
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`p-4 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {isSidebarOpen && <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>PehlaHath</h2>}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          {isSidebarOpen ? <X size={20} className={isDarkMode ? 'text-white' : 'text-gray-800'} /> : <Menu size={20} className={isDarkMode ? 'text-white' : 'text-gray-800'} />}
        </button>
      </div>
      
      <nav className="p-4 flex flex-col h-[calc(100%-80px)] justify-between">
        <div>
          {sidebarItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'} 
                p-3 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-blue-50 text-gray-700 hover:text-blue-600'} mb-2`}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </div>
        
        <button
          onClick={logout}
          className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'} 
            p-3 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-600 hover:text-red-700'}`}
        >
          <LogOut size={20} />
          {isSidebarOpen && <span>Sign Out</span>}
        </button>
      </nav>
    </div>
  );
}