'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!user) {
    return <>{children}</>
  }

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace', icon: '🏪' },
    { href: '/inbox', label: 'Inbox', icon: '💬' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ]

  if (user.role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'Admin', icon: '⚙️' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/marketplace" 
              className="text-2xl font-bold gradient-text hover:scale-105 transition-transform duration-200"
            >
              CampusCycle
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-green-100 text-green-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="hidden lg:inline">{link.icon} </span>
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout()
                  router.push('/')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 animate-slide-up">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout()
                  router.push('/')
                }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  )
}
