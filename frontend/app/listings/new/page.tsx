'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Layout from '@/components/Layout'

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    isGiveaway: false,
    location: '',
    zipcode: '',
  })
  const [images, setImages] = useState<File[]>([])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('condition', formData.condition)
      formDataToSend.append('price', formData.isGiveaway ? '0' : formData.price)
      formDataToSend.append('isGiveaway', formData.isGiveaway.toString())
      if (formData.location) formDataToSend.append('location', formData.location)
      if (formData.zipcode) formDataToSend.append('zipcode', formData.zipcode)

      images.forEach((image) => {
        formDataToSend.append('images', image)
      })

      const response = await api.post('/listings', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Redirect to marketplace so user can see their new listing
      router.push('/marketplace')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create listing')
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Create New Listing</h1>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (up to 5)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              max={5}
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setImages(files.slice(0, 5))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {images.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {images.length} image(s) selected
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Listing'}
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

