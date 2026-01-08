'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

export default function VerifyContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const registered = searchParams.get('registered')
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(
    token ? 'pending' : registered ? 'pending' : 'pending'
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      api
        .get(`/auth/verify-email?token=${token}`)
        .then(() => {
          setStatus('success')
          setMessage('Email verified successfully! You can now log in.')
        })
        .catch((err) => {
          setStatus('error')
          setMessage(err.response?.data?.error || 'Verification failed')
        })
    } else if (registered) {
      setStatus('pending')
      setMessage('Registration successful! Please check your email for a verification link.')
    }
  }, [token, registered])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-3xl font-bold text-green-600">CampusCycle</h1>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        {status === 'pending' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-600 mb-4">{message}</p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-red-600 mb-4">{message}</p>
            <Link
              href="/auth/register"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Back to Register
            </Link>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>
            In development mode, check the backend console for the verification link.
          </p>
        </div>
      </div>
    </div>
  )
}

