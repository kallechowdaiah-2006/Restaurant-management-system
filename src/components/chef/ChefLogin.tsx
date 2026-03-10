import { useState } from 'react';
import { useChef } from '../../contexts/ChefContext';
import { supabase } from '../../lib/supabase';
import { ChefHat, UserPlus, LogIn } from 'lucide-react';

export function ChefLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login } = useChef();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result) {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Check if username already exists
      const { data: existing } = await supabase
        .from('chef_users')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();

      if (existing) {
        setError('Username already exists. Please choose another.');
        setLoading(false);
        return;
      }

      // Create new chef account
      const { error: insertError } = await supabase
        .from('chef_users')
        .insert({
          username: username.trim(),
          password_hash: password,
        });

      if (insertError) {
        setError('Failed to create account. Please try again.');
      } else {
        setSuccess('Account created successfully! You can now log in.');
        setIsSignUp(false);
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <ChefHat className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Chef Portal</h1>
          <p className="text-gray-600">
            {isSignUp ? 'Create a new chef account' : 'Manage your kitchen orders'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => switchMode()}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition ${
              !isSignUp ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>
          <button
            onClick={() => switchMode()}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition ${
              isSignUp ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
          <div>
            <label htmlFor="chef-username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="chef-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label htmlFor="chef-password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="chef-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Enter password"
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="chef-confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="chef-confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 disabled:transform-none"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isSignUp
            ? 'Already have an account? Switch to Login above.'
            : 'Default: username: chef, password: chef123'}
        </div>
      </div>
    </div>
  );
}
