'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import api from './api'
import Cookies from 'js-cookie'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string | null
  campus: {
    id: string
    name: string
    code: string
  }
  gradYear?: number | null
  avatar?: string | null
  role: 'USER' | 'ADMIN'
  isVerified: boolean
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  name?: string
  campusId: string
  gradYear?: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      setUser(null)
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  useEffect(() => {
    // Protect routes
    if (!loading) {
      const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/verify']
      const isPublicRoute = publicRoutes.includes(pathname)
      
      if (!user && !isPublicRoute) {
        router.push('/auth/login')
      } else if (user && !user.isVerified && !pathname.startsWith('/auth/verify')) {
        router.push('/auth/verify')
      } else if (user && user.isVerified && pathname.startsWith('/auth/') && pathname !== '/auth/verify') {
        router.push('/marketplace')
      }
    }
  }, [user, loading, pathname, router])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { accessToken, refreshToken, user } = response.data

    Cookies.set('accessToken', accessToken, { expires: 7 })
    Cookies.set('refreshToken', refreshToken, { expires: 7 })
    setUser(user)

    if (!user.isVerified) {
      router.push('/auth/verify')
    } else {
      router.push('/marketplace')
    }
  }

  const register = async (data: RegisterData) => {
    await api.post('/auth/register', data)
    router.push('/auth/verify?registered=true')
  }

  const logout = () => {
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

