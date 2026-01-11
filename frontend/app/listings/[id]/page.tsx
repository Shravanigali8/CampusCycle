'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  location: string | null
  zipcode: string | null
  images: { id: string; url: string }[]
  seller: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  createdAt: string
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingThread, setCreatingThread] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [params.id])

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${params.id}`)
      setListing(response.data.listing)
    } catch (error: any) {
      if (error.response?.status === 404) {
        router.push('/marketplace')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = async () => {
    if (!listing) return

    setCreatingThread(true)
    try {
      const response = await api.post('/conversations', {
        listingId: listing.id,
      })
      router.push(`/chat/${response.data.thread.id}`)
    } catch (error: any) {
      if (error.response?.status === 400) {
        // Thread might already exist, try to find it
        const threadsResponse = await api.get('/conversations')
        const existingThread = threadsResponse.data.threads.find(
          (t: any) => t.listingId === listing.id
        )
        if (existingThread) {
          router.push(`/chat/${existingThread.id}`)
        }
      }
    } finally {
      setCreatingThread(false)
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

  if (!listing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">Listing not found</p>
        </div>
      </Layout>
    )
  }

  const isOwner = user?.id === listing.seller.id

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {listing.images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative h-96 w-full bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(listing.images[0].url)}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {listing.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {listing.images.slice(1).map((image) => (
                      <div
                        key={image.id}
                        className="relative h-24 w-full bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={getImageUrl(image.url)}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{listing.title}</h1>
                {listing.isGiveaway && (
                  <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded">
                    GIVEAWAY
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mb-4">
                {!listing.isGiveaway && (
                  <span className="text-3xl font-bold text-green-600">
                    ${listing.price.toFixed(2)}
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
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

            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-600">Category</span>
                <p className="font-medium">{listing.category}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Condition</span>
                <p className="font-medium">{listing.condition}</p>
              </div>
              {listing.location && (
                <div>
                  <span className="text-sm text-gray-600">Location</span>
                  <p className="font-medium">{listing.location}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Seller</h3>
              <p className="text-gray-700">{listing.seller.name || listing.seller.email}</p>
            </div>

            {!isOwner && listing.status !== 'SOLD' && (
              <button
                onClick={handleMessage}
                disabled={creatingThread}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {creatingThread ? 'Opening chat...' : 'Message Seller'}
              </button>
            )}

            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/listings/${listing.id}/edit`)}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                >
                  Edit Listing
                </button>
                {listing.status !== 'SOLD' && (
                  <button
                    onClick={async () => {
                      try {
                        await api.patch(`/listings/${listing.id}`, {
                          status: listing.status === 'AVAILABLE' ? 'CLAIMED' : 'SOLD',
                        })
                        fetchListing()
                      } catch (error) {
                        console.error('Failed to update status:', error)
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                  >
                    Mark as {listing.status === 'AVAILABLE' ? 'Claimed' : 'Sold'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

