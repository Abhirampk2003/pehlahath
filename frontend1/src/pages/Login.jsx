import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthProvider';

const BACKEND_URL = "http://localhost:5000/api/auth";

export function Login() {
  const { login } = useAuth(); // Use AuthContext
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      console.log('Attempting login with:', { email });
      const response = await axios.post(`${BACKEND_URL}/login`, { email, password });
      console.log('Login response:', response.data);
      
      if (response.data && response.data.token) {
        const userData = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          role: response.data.role
        };
        login(response.data.token, userData);
        toast.success('Welcome back!');
      } else {
        console.error('Invalid response format:', response.data);
        toast.error('Server response format error');
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Sign in to <span className="text-red-500">PehlaHath</span>
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-red-600 hover:text-red-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" 
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" 
            />
          </div>

          <div>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
