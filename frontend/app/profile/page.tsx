'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import Layout from '@/components/Layout'

interface Listing {
  id: string
  title: string
  price: number
  isGiveaway: boolean
  status: 'AVAILABLE' | 'CLAIMED' | 'SOLD'
  images: { id: string; url: string }[]
  createdAt: string
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    gradYear: user?.gradYear?.toString() || '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        gradYear: user.gradYear?.toString() || '',
      })
    }
    fetchListings()
  }, [user])

  const fetchListings = async () => {
    try {
      const response = await api.get('/users/me/listings')
      setListings(response.data.listings)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.patch('/users/me', {
        name: formData.name || undefined,
        gradYear: formData.gradYear ? parseInt(formData.gradYear) : undefined,
      })
      await refreshUser()
      setEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{user.name || 'No name set'}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">{user.campus.name}</p>
            </div>
            <button
              onClick={() => (editing ? handleSave() : setEditing(true))}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              {editing ? 'Save' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.gradYear}
                  onChange={(e) =>
                    setFormData({ ...formData, gradYear: e.target.value })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Graduation Year</span>
                <p className="font-medium">{user.gradYear || 'Not set'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Member since</span>
                <p className="font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Listings</h2>
            <Link
              href="/listings/new"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              + New Listing
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600 mb-4">You haven&apos;t created any listings yet</p>
              <Link
                href="/listings/new"
                className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {listing.images.length > 0 && (
                    <div className="relative h-48 w-full bg-gray-100">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${listing.images[0].url}`}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {listing.isGiveaway ? (
                        <span className="bg-green-100 text-green-800 text-sm font-semibold px-2 py-1 rounded">
                          FREE
                        </span>
                      ) : (
                        <span className="text-xl font-bold text-green-600">
                          ${listing.price.toFixed(2)}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          listing.status === 'AVAILABLE'
                            ? 'bg-blue-100 text-blue-800'
                            : listing.status === 'CLAIMED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

