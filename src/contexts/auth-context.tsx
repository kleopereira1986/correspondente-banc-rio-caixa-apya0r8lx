import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

export type Role = 'master' | 'analyst' | 'buyer' | 'seller' | 'broker' | 'real_estate_agency'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  is_approved: boolean
  real_estate_agency?: string
  phone?: string
  cpf?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password?: string) => Promise<{ error: any }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(pb.authStore.record as User | null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record as User | null)
    })
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password = 'Skip@Pass') => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      const record = pb.authStore.record as unknown as User

      if (!record.is_approved) {
        navigate('/pending-approval')
        return { error: null }
      }

      const role = record.role as Role
      if (role === 'master' || role === 'analyst' || role === 'broker') {
        navigate('/dashboard')
      } else if (role === 'real_estate_agency') {
        navigate('/agency/dashboard')
      } else {
        navigate('/portal')
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const logout = () => {
    pb.authStore.clear()
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
