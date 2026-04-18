import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export type Role = 'master' | 'analyst' | 'buyer' | 'seller'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthContextType {
  user: User | null
  login: (role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  const login = (role: Role) => {
    const mockUsers: Record<Role, User> = {
      master: { id: '1', name: 'Ana Silva (Master)', email: 'master@caixa.gov.br', role: 'master' },
      analyst: {
        id: '2',
        name: 'Carlos Santos (Analista)',
        email: 'analista@caixa.gov.br',
        role: 'analyst',
      },
      buyer: {
        id: '3',
        name: 'Roberto Almeida (Comprador)',
        email: 'roberto@email.com',
        role: 'buyer',
      },
      seller: {
        id: '4',
        name: 'Juliana Costa (Vendedora)',
        email: 'juliana@email.com',
        role: 'seller',
      },
    }
    setUser(mockUsers[role])
    if (role === 'master' || role === 'analyst') {
      navigate('/dashboard')
    } else {
      navigate('/portal')
    }
  }

  const logout = () => {
    setUser(null)
    navigate('/')
  }

  return React.createElement(AuthContext.Provider, { value: { user, login, logout } }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
