import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthProvider';
import { useThemeStore } from './store/theme';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Register } from './pages/Register';
import { Alerts } from './pages/Alerts';
import { Chat } from './pages/Chat';
import { EmergencyContacts } from './pages/EmergencyContacts';
import { ReportDisaster } from './pages/ReportDisaster';
import { Resources } from './pages/Resources';
import { Settings } from './pages/Settings';
import { Volunteers } from './pages/Volunteers';
import { Layout } from './components/Layout';

function App() {
  const { user } = useAuth();
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={<Register/>}/>
        <Route element={<Layout />}>
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/alerts" element={<Alerts/>}/>
          <Route path="/chat" element={<Chat/>}/>
          <Route path="/emergency-contacts" element={<EmergencyContacts/>}/>
          <Route path="/report-disaster" element={<ReportDisaster/>}/>
          <Route path="/resources" element={<Resources/>}/>
          <Route path="/settings" element={<Settings/>}/>
          <Route path="/volunteers" element={<Volunteers/>}/>
        </Route>
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;
