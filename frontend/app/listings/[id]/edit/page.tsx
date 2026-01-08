'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import Layout from '@/components/Layout'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    isGiveaway: false,
    status: 'AVAILABLE' as 'AVAILABLE' | 'CLAIMED' | 'SOLD',
    location: '',
    zipcode: '',
  })

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

  useEffect(() => {
    fetchListing()
  }, [params.id])

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${params.id}`)
      const listing = response.data.listing
      setFormData({
        title: listing.title,
        description: listing.description,
        category: listing.category,
        condition: listing.condition,
        price: listing.price.toString(),
        isGiveaway: listing.isGiveaway,
        status: listing.status,
        location: listing.location || '',
        zipcode: listing.zipcode || '',
      })
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        router.push('/marketplace')
      }
      setError('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await api.patch(`/listings/${params.id}`, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        price: formData.isGiveaway ? 0 : Number(formData.price),
        isGiveaway: formData.isGiveaway,
        status: formData.status,
        location: formData.location || undefined,
        zipcode: formData.zipcode || undefined,
      })

      router.push(`/listings/${params.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update listing')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Edit Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={6}
              maxLength={5000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">Select...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: e.target.value })
                }
              >
                <option value="">Select...</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'AVAILABLE' | 'CLAIMED' | 'SOLD',
                })
              }
            >
              <option value="AVAILABLE">Available</option>
              <option value="CLAIMED">Claimed</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isGiveaway}
                onChange={(e) =>
                  setFormData({ ...formData, isGiveaway: e.target.checked })
                }
              />
              <span className="text-sm font-medium text-gray-700">
                This is a giveaway (free)
              </span>
            </label>
          </div>

          {!formData.isGiveaway && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zipcode
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.zipcode}
                onChange={(e) =>
                  setFormData({ ...formData, zipcode: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

