import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../AuthContext';



export default function Login() {

  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);



  const handleSubmit = async (e: any) => {

    e.preventDefault();

    setError('');

    setLoading(true);

    try {

      await login(email, password);
      navigate('/');

    } catch (err: any) {

      setError(err.message || 'Login failed');

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-700">

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-emerald-900">ChaloJi</h1>

          <p className="text-gray-500 mt-1">Admin Panel</p>

        </div>



        <form onSubmit={handleSubmit} className="space-y-5">

          {error && (

            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">

              {error}

            </div>

          )}



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>

            <input

              type="email"

              required

              value={email}

              onChange={(e) => setEmail(e.target.value)}

              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"

              placeholder="admin@chalojii.in"

            />

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>

            <input

              type="password"

              required

              value={password}

              onChange={(e) => setPassword(e.target.value)}

              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"

              placeholder="••••••••"

            />

          </div>



          <button

            type="submit"

            disabled={loading}

            className="w-full bg-emerald-700 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50"

          >

            {loading ? 'Signing in...' : 'Sign In'}

          </button>

        </form>

      </div>

    </div>

  );

}

