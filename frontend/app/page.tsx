import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth-server'

export default async function HomePage() {
  const session = await getServerSession()
  
  if (session?.user) {
    redirect('/marketplace')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold gradient-text hover:scale-105 transition-transform duration-200">
            CampusCycle
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-green-600 hover:text-green-700 font-medium transition-colors duration-200 hidden sm:block"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="btn btn-primary"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 slide-up">
            Buy, Sell, & Give Away
            <span className="block text-green-600 mt-2 animate-pulse">On Your Campus</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 slide-up animation-delay-200">
            A student-only platform for resale and giveaways. 
            <span className="block mt-2">Verified with .edu email. Safe, affordable, sustainable.</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 slide-up animation-delay-300">
            <Link
              href="/auth/register"
              className="btn btn-primary text-lg px-8 py-4 scale-in"
            >
              Get Started Free
            </Link>
            <Link
              href="/marketplace"
              className="btn btn-outline text-lg px-8 py-4 scale-in"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          <div className="card p-6 lg:p-8 text-center hover:shadow-lg transition-all duration-300 fade-in">
            <div className="text-5xl mb-4 animate-bounce-slow">🔒</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Secure</h3>
            <p className="text-gray-600 leading-relaxed">
              .edu email verification ensures only students can participate in your campus community
            </p>
          </div>
          <div className="card p-6 lg:p-8 text-center hover:shadow-lg transition-all duration-300 fade-in animation-delay-200">
            <div className="text-5xl mb-4 animate-bounce-slow" style={{ animationDelay: '0.2s' }}>💰</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Affordable</h3>
            <p className="text-gray-600 leading-relaxed">
              Great deals and free giveaways from your campus community. Save money while helping others
            </p>
          </div>
          <div className="card p-6 lg:p-8 text-center hover:shadow-lg transition-all duration-300 fade-in animation-delay-400">
            <div className="text-5xl mb-4 animate-bounce-slow" style={{ animationDelay: '0.4s' }}>🌱</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Sustainable</h3>
            <p className="text-gray-600 leading-relaxed">
              Reduce waste by giving items a second life on campus. Make a positive environmental impact
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 card">
            <div className="text-3xl font-bold text-green-600 mb-2">100+</div>
            <div className="text-sm text-gray-600">Active Listings</div>
          </div>
          <div className="text-center p-6 card">
            <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
            <div className="text-sm text-gray-600">Happy Students</div>
          </div>
          <div className="text-center p-6 card">
            <div className="text-3xl font-bold text-green-600 mb-2">2</div>
            <div className="text-sm text-gray-600">Campuses</div>
          </div>
          <div className="text-center p-6 card">
            <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2024 CampusCycle. Built for students, by students.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
