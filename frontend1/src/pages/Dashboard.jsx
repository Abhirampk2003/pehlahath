import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { AlertTriangle, Users, MessageSquare, Bell, Phone, Shield, LogOut, ChevronRight, Activity } from 'lucide-react';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';
import { useThemeStore } from '../store/theme';
import { backendService } from '../services/backendService';
import toast from 'react-hot-toast';

const BACKEND_URL = "http://localhost:5000/api/auth/dashboard";
const ALERTS_URL = "http://localhost:5000/api/auth/reports";
const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Add this function to get marker icon based on severity
// Update the getMarkerIcon function to handle undefined google object
const getMarkerIcon = (severity) => {
  if (!window.google) return null;

  const baseConfig = {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 10,
    strokeWeight: 2,
    fillOpacity: 1
  };

  switch (severity) {
    case 'critical':
      return { ...baseConfig, fillColor: '#EF4444', strokeColor: '#B91C1C' };
    case 'high':
      return { ...baseConfig, fillColor: '#F97316', strokeColor: '#C2410C' };
    case 'medium':
      return { ...baseConfig, fillColor: '#FBBF24', strokeColor: '#B45309' };
    case 'low':
      return { ...baseConfig, fillColor: '#34D399', strokeColor: '#047857' };
    default:
      return { ...baseConfig, fillColor: '#9CA3AF', strokeColor: '#4B5563' };
  }
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Map component separated to prevent reloading
// Add geocodeAddress function at the top with other utility functions
const geocodeAddress = async (address) => {
  try {
    const geocoder = new window.google.maps.Geocoder();
    const result = await new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
          resolve(results[0].geometry.location);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
    return {
      lat: result.lat(),
      lng: result.lng()
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Update the EmergencyMap component to include geocoding
const EmergencyMap = React.memo(({ selectedIncident, setSelectedIncident, location, alerts }) => {
  const [map, setMap] = useState(null);
  const [geocodedAlerts, setGeocodedAlerts] = useState([]);
  const [isApiReady, setIsApiReady] = useState(false);

  // Add an effect to check if Google Maps API is ready
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsApiReady(true);
    }
  }, []);

  // Update the geocoding effect to wait for API and alerts
  useEffect(() => {
    const geocodeAlerts = async () => {
      console.log('Starting geocoding process...', { isApiReady, alertsLength: alerts.length });
      if (!isApiReady || !alerts.length) return;

      try {
        const geocoded = await Promise.all(
          alerts.map(async (alert) => {
            console.log('Processing alert:', alert);
            if (alert.location.includes(',')) {
              const [lat, lng] = alert.location.split(',').map(coord => parseFloat(coord.trim()));
              return { ...alert, coordinates: { lat, lng } };
            } else {
              const coordinates = await geocodeAddress(alert.location);
              console.log('Geocoded coordinates for', alert.location, ':', coordinates);
              return { ...alert, coordinates };
            }
          })
        );
        const validAlerts = geocoded.filter(alert => alert.coordinates);
        console.log('Processed alerts:', validAlerts);
        setGeocodedAlerts(validAlerts);
      } catch (error) {
        console.error('Error during geocoding:', error);
      }
    };

    geocodeAlerts();
  }, [alerts, isApiReady]);

  const onLoad = React.useCallback((map) => {
    const bounds = new window.google.maps.LatLngBounds();
    
    if (location) {
      bounds.extend(new window.google.maps.LatLng(location.latitude, location.longitude));
    }

    // Add alert locations to bounds
    alerts.forEach(alert => {
      // Parse location string to coordinates (assuming format: "lat,lng")
      const [lat, lng] = alert.location.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.extend(new window.google.maps.LatLng(lat, lng));
      }
    });

    if (location || alerts.length > 0) {
      map.fitBounds(bounds);
    }

    setMap(map);
  }, [location, alerts]);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={location ? { lat: location.latitude, lng: location.longitude } : { lat: 20, lng: 0 }}
      zoom={location ? 10 : 2}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {location && (
        <Marker 
          position={{ lat: location.latitude, lng: location.longitude }} 
          label="You" 
        />
      )}
      
      {geocodedAlerts.map((alert) => (
        <Marker
          key={alert._id}
          position={alert.coordinates}
          onClick={() => setSelectedIncident(alert)}
          icon={getMarkerIcon(alert.severity)}
        />
      ))}

      {selectedIncident && selectedIncident.coordinates && (
        <InfoWindow
          position={selectedIncident.coordinates}
          onCloseClick={() => setSelectedIncident(null)}
        >
          <div className="p-2">
            <h3 className="font-semibold text-gray-900">{selectedIncident.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{selectedIncident.description}</p>
            <div className="mt-2">
              <span className="text-xs font-medium text-gray-500">
                Severity: {selectedIncident.severity}
              </span>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
});

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [stats, setStats] = useState({
    activeDisasters: 0,
    totalVolunteers: 0,
    emergencyContacts: 0,
    resourceRequests: 0
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: VITE_GOOGLE_MAPS_API_KEY
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Add handleClick function definition
  const handleClick = () => {
    navigate("/report-disaster");
  };

  // Add this useEffect to fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get(ALERTS_URL + '/get-report', {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        console.log("Raw response data:", response.data);
        const alertsData = Array.isArray(response.data) ? response.data : 
                         response.data.reports ? response.data.reports : [];
        console.log("Processed alerts data:", alertsData);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    if (user?.token) {
      fetchAlerts();
    }
  }, [user]);

  // Add this effect to monitor alerts state changes
  useEffect(() => {
    console.log("Current alerts state:", alerts);
  }, [alerts]);

  // Move the early return after all useEffect declarations
  if (!user) return null;

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(userLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      console.log("User location:", location); // This will run only when location updates
    }
  }, [location]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await backendService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  const menuItems = [
    {
      title: 'Report Disaster',
      description: 'Report a new disaster or emergency situation',
      icon: AlertTriangle,
      path: '/report-disaster',
      color: 'text-red-500'
    },
    {
      title: 'Emergency Contacts',
      description: 'Manage emergency contact information',
      icon: Phone,
      path: '/emergency-contacts',
      color: 'text-blue-500'
    },
    {
      title: 'Resources',
      description: 'View and manage available resources',
      icon: Shield,
      path: '/resources',
      color: 'text-green-500'
    },
    {
      title: 'Alerts',
      description: 'View and manage emergency alerts',
      icon: Bell,
      path: '/alerts',
      color: 'text-yellow-500'
    },
    {
      title: 'Volunteers',
      description: 'View and manage volunteer information',
      icon: Users,
      path: '/volunteers',
      color: 'text-purple-500'
    },
    {
      title: 'Settings',
      description: 'Manage your account settings',
      icon: ChevronRight,
      path: '/settings',
      color: 'text-gray-500'
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
              <h1 className={`ml-2 text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Disaster Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Active Disasters
                </p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.activeDisasters}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Volunteers
                </p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalVolunteers}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Emergency Contacts
                </p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.emergencyContacts}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Resource Requests
                </p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.resourceRequests}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6">
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${item.color.replace('text-', 'bg-')} bg-opacity-10`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="ml-4 text-left">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`mt-8 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6">
            <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Recent Activity
            </h2>
            <div className="space-y-4">
              {/* Activity items would go here */}
              <div className={`flex items-center p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <Activity className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`ml-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  No recent activity to display
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;