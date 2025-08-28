import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Email atau kata laluan tidak sah');
      }
    } catch (err) {
      setError('Ralat semasa log masuk. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@gmail.com', role: 'Admin', password: 'password123' },
    { email: 'user1exco@gmail.com', role: 'EXCO User', password: 'password123' },
    { email: 'finance_mmk@gmail.com', role: 'Finance MMK', password: 'password123' },
    { email: 'finance_officer@gmail.com', role: 'Finance Officer', password: 'password123' },
    { email: 'super_admin@gmail.com', role: 'Super Admin', password: 'password123' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/kedah-logo-png.png" 
            alt="Kedah State Government Logo" 
            className="w-16 h-16 mx-auto mb-4 object-contain"
            onError={(e) => {
              // Fallback to default if image fails to load
              e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Coat_of_arms_of_Kedah.svg/200px-Coat_of_arms_of_Kedah.svg.png";
            }}
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Charity Program Management System
          </h1>
          <p className="text-gray-600">Kedah State Government</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              Invalid email or password
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4 text-center">Demo Accounts:</p>
          <div className="space-y-2">
            {demoAccounts.map((account, index) => (
              <div key={index} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                <span className="font-medium">{account.role}</span>
                <span className="text-gray-600">{account.email}</span>
              </div>
            ))}
            <p className="text-xs text-gray-500 text-center mt-2">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;