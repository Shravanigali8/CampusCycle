import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  campus: {
    id: string
    name: string
    code: string
  }
  role: 'USER' | 'ADMIN'
  isVerified: boolean
}

export async function getServerSession(): Promise<{ user: SessionUser } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return null
    }
    
    // Fetch user from API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (!data.user) {
      return null
    }
    return { user: data.user }
  } catch (error) {
    return null
  }
}

