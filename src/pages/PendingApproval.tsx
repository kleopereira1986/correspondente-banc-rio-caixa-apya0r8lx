import { ShieldAlert, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Navigate } from 'react-router-dom'

export default function PendingApproval() {
  const { user, logout } = useAuth()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (user.is_approved) {
    if (user.role === 'master' || user.role === 'analyst' || user.role === 'broker') {
      return <Navigate to="/dashboard" replace />
    }
    return <Navigate to="/portal" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in-up bg-white p-8 rounded-2xl shadow-sm border border-border/50">
        <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-amber-600 mb-6">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Aguardando Aprovação</h1>
        <p className="text-slate-600">
          Seu cadastro foi recebido com sucesso e está em análise. Você receberá acesso assim que um
          administrador aprovar sua conta.
        </p>
        <div className="pt-6">
          <Button onClick={logout} variant="outline" className="gap-2 w-full">
            <LogOut size={16} /> Sair da conta
          </Button>
        </div>
      </div>
    </div>
  )
}
