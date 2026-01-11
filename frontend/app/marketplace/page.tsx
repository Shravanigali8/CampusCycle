'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import Layout from '@/components/Layout'
import { getImageUrl } from '@/lib/utils'

interface Listing {
  id: string
  title: string
  description: string
  category: string
  condition: string
  price: number
  isGiveaway: boolean
  status: 'AVAILABLE' | 'CLAIMED' | 'SOLD'
  images: { id: string; url: string }[]
  seller: {
    id: string
    name: string | null
    avatar: string | null
  }
  createdAt: string
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    isGiveaway: '',
    status: '',
    q: '',
    zipcode: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    fetchListings()
  }, [filters])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/listings?${params.toString()}`)
      setListings(response.data.listings)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'textbooks',
    'electronics',
    'furniture',
    'clothing',
    'appliances',
    'bikes',
    'other',
  ]

  const conditions = ['excellent', 'good', 'fair', 'poor']

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      isGiveaway: '',
      status: '',
      q: '',
      zipcode: '',
    })
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Marketplace</h1>
            <p className="text-gray-600 text-sm sm:text-base">Discover items from your campus community</p>
          </div>
          <Link
            href="/listings/new"
            className="btn btn-primary w-full sm:w-auto"
          >
            <span className="hidden sm:inline">+ </span>New Listing
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`lg:w-64 bg-white p-4 sm:p-6 rounded-lg shadow-sm transition-all duration-300 ${
              showFilters ? 'block' : 'hidden'
            } lg:block lg:sticky lg:top-4 lg:h-fit`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search listings..."
                  className="input"
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="input"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  className="input"
                  value={filters.condition}
                  onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                >
                  <option value="">All Conditions</option>
                  {conditions.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond.charAt(0).toUpperCase() + cond.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="input flex-1"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="input flex-1"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  />
                </div>
              </div>

              {/* Giveaway Toggle */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="giveaway"
                  checked={filters.isGiveaway === 'true'}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      isGiveaway: e.target.checked ? 'true' : '',
                    })
                  }
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="giveaway" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Giveaways Only
                </label>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="input"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">Available/Claimed</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="CLAIMED">Claimed</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* Listings Grid */}
          <main className="flex-1">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden mb-4 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="badge badge-success">{Object.values(filters).filter(v => v !== '').length}</span>
              )}
            </button>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Loading listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-600 mb-4">No listings found</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn btn-outline">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {listings.map((listing, index) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="card card-hover group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Image */}
                    {listing.images.length > 0 ? (
                      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                        <Image
                          src={getImageUrl(listing.images[0].url)}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          unoptimized
                        />
                        {listing.isGiveaway && (
                          <div className="absolute top-2 right-2">
                            <span className="badge badge-success">FREE</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className={`badge ${
                            listing.status === 'AVAILABLE' ? 'badge-info' :
                            listing.status === 'CLAIMED' ? 'badge-warning' :
                            'badge-gray'
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">📦</span>
                        {listing.isGiveaway && (
                          <div className="absolute top-2 right-2">
                            <span className="badge badge-success">FREE</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        {!listing.isGiveaway && (
                          <span className="text-xl font-bold text-green-600">
                            ${listing.price.toFixed(2)}
                          </span>
                        )}
                        {listing.isGiveaway && (
                          <span className="text-xl font-bold text-green-600">Free</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {listing.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">{listing.category}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">{listing.condition}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  )
}
