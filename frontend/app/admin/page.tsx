'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface Report {
  id: string
  reason: string
  createdAt: string
  reporter: { id: string; name: string | null; email: string }
  listing: { id: string; title: string } | null
  targetUser: { id: string; name: string | null; email: string } | null
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/marketplace')
      return
    }
    if (user?.role === 'ADMIN') {
      fetchReports()
    }
  }, [user, router])

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports')
      setReports(response.data.reports)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      await api.delete(`/listings/${listingId}`)
      fetchReports()
      alert('Listing deleted successfully')
    } catch (error) {
      console.error('Failed to delete listing:', error)
      alert('Failed to delete listing')
    }
  }

  if (user?.role !== 'ADMIN') {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">Reports</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : reports.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No reports</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Reason:</p>
                      <p className="text-gray-700 mb-4">{report.reason}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Reported by:</span>
                          <p className="font-medium">
                            {report.reporter.name || report.reporter.email}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <p className="font-medium">
                            {new Date(report.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {report.listing && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-semibold mb-1">Reported Listing:</p>
                      <p className="text-sm text-gray-700 mb-2">{report.listing.title}</p>
                      <button
                        onClick={() => handleDeleteListing(report.listing!.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-medium"
                      >
                        Delete Listing
                      </button>
                    </div>
                  )}

                  {report.targetUser && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-semibold mb-1">Reported User:</p>
                      <p className="text-sm text-gray-700">
                        {report.targetUser.name || report.targetUser.email}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

