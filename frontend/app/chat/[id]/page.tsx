'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import Layout from '@/components/Layout'
import Cookies from 'js-cookie'

interface Message {
  id: string
  body: string
  senderId: string
  sender: { id: string; name: string | null; avatar: string | null }
  createdAt: string
  readAt: string | null
}

export default function ChatPage() {
  const params = useParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()

    // Setup Socket.IO
    const token = Cookies.get('accessToken')
    if (token) {
      const socketConnection = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
        auth: { token },
      })

      socketConnection.on('connect', () => {
        socketConnection.emit('join-thread', params.id)
      })

      socketConnection.on('message', (message: Message) => {
        setMessages((prev) => [...prev, message])
        scrollToBottom()
      })

      socketConnection.on('messages-read', () => {
        // Mark messages as read in UI
      })

      setSocket(socketConnection)

      return () => {
        socketConnection.disconnect()
      }
    }
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/conversations/${params.id}/messages`)
      setMessages(response.data.messages)
      
      // Mark as read
      await api.post(`/conversations/${params.id}/read`)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageBody = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      body: messageBody,
      senderId: user!.id,
      sender: {
        id: user!.id,
        name: user!.name,
        avatar: null,
      },
      createdAt: new Date().toISOString(),
      readAt: null,
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      // Send via socket (which will also save to DB)
      if (socket) {
        socket.emit('message', {
          threadId: params.id,
          body: messageBody,
        })
      } else {
        // Fallback to REST API
        const response = await api.post(`/conversations/${params.id}/messages`, {
          body: messageBody,
        })
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMessage.id ? response.data.message : m))
        )
      }
    } catch (error) {
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
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
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <div className="card h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                        isOwn
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-semibold mb-1.5 opacity-90">
                          {message.sender.name || 'Unknown'}
                        </p>
                      )}
                      <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{message.body}</p>
                      <p
                        className={`text-xs mt-2 ${
                          isOwn ? 'text-green-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="input flex-1"
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !sending && newMessage.trim()) {
                    e.preventDefault()
                    const form = e.currentTarget.closest('form')
                    if (form) {
                      form.requestSubmit()
                    }
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="btn btn-primary px-6 sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="spinner"></span>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Press Enter to send</p>
          </form>
        </div>
      </div>
    </Layout>
  )
}

