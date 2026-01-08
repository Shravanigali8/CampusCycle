'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'

interface Thread {
  id: string
  listing: {
    id: string
    title: string
    images: { id: string; url: string }[]
  }
  buyer: { id: string; name: string | null; avatar: string | null }
  seller: { id: string; name: string | null; avatar: string | null }
  messages: Array<{
    id: string
    body: string
    sender: { id: string; name: string | null }
    createdAt: string
  }>
  updatedAt: string
  unreadCount: number
}

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      const response = await api.get('/conversations')
      setThreads(response.data.threads)
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Inbox</h1>

        {threads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No conversations yet</p>
            <Link
              href="/marketplace"
              className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => {
              const lastMessage = thread.messages[0]
              return (
                <Link
                  key={thread.id}
                  href={`/chat/${thread.id}`}
                  className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex gap-4">
                    {thread.listing.images.length > 0 && (
                      <div className="relative h-20 w-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${thread.listing.images[0].url}`}
                          alt={thread.listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold truncate">{thread.listing.title}</h3>
                        {thread.unreadCount > 0 && (
                          <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {lastMessage.sender.name || 'Someone'}: {lastMessage.body}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(thread.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

