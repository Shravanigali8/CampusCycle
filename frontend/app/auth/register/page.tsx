'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import api from '@/lib/api'

interface Campus {
  id: string
  name: string
  code: string
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [campusId, setCampusId] = useState('')
  const [gradYear, setGradYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loadingCampuses, setLoadingCampuses] = useState(true)
  const { register } = useAuth()

  useEffect(() => {
    api.get('/campuses')
      .then((res) => {
        setCampuses(res.data.campuses)
        setLoadingCampuses(false)
      })
      .catch(() => setLoadingCampuses(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.endsWith('.edu')) {
      setError('Must use a .edu email address')
      return
    }

    if (!campusId) {
      setError('Please select a campus')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await register({
        email,
        password,
        name: name || undefined,
        campusId,
        gradYear: gradYear ? parseInt(gradYear) : undefined,
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 fade-in">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold gradient-text hover:scale-105 transition-transform duration-200">
              CampusCycle
            </h1>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Must use a .edu email address
          </p>
        </div>
        
        <form className="mt-8 space-y-6 card p-6 sm:p-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded animate-slide-up" role="alert">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (.edu required)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="your.email@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {email && !email.endsWith('.edu') && (
                <p className="mt-1 text-xs text-red-600">Must use a .edu email</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password (min 8 characters)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="input"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password && password.length < 8 && (
                <p className="mt-1 text-xs text-red-600">Password must be at least 8 characters</p>
              )}
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name (optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="campus" className="block text-sm font-medium text-gray-700 mb-2">
                Campus *
              </label>
              {loadingCampuses ? (
                <div className="input flex items-center justify-center">
                  <span className="spinner"></span>
                </div>
              ) : (
                <select
                  id="campus"
                  name="campus"
                  required
                  className="input"
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                >
                  <option value="">Select a campus</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div>
              <label htmlFor="gradYear" className="block text-sm font-medium text-gray-700 mb-2">
                Graduation Year (optional)
              </label>
              <input
                id="gradYear"
                name="gradYear"
                type="number"
                min="1900"
                max="2100"
                className="input"
                placeholder="e.g. 2025"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || loadingCampuses}
              className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner"></span>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
