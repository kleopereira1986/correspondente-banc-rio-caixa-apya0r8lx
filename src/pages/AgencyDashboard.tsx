import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/auth-context'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FolderOpen, CheckCircle2, Clock } from 'lucide-react'

export default function AgencyDashboard() {
  const { user } = useAuth()
  const [brokersCount, setBrokersCount] = useState(0)
  const [processes, setProcesses] = useState<any[]>([])

  useEffect(() => {
    if (!user?.real_estate_agency) return

    const fetchDashboardData = async () => {
      try {
        const brokers = await pb.collection('users').getFullList({
          filter: `role = 'broker' && real_estate_agency = '${user.real_estate_agency}'`,
          fields: 'id',
        })
        setBrokersCount(brokers.length)

        const procs = await pb.collection('processes').getFullList({
          filter: `broker.real_estate_agency = '${user.real_estate_agency}'`,
        })
        setProcesses(procs)
      } catch (err) {
        console.error(err)
      }
    }

    fetchDashboardData()
  }, [user?.real_estate_agency])

  const pendingCount = processes.filter(
    (p) => p.result === 'pending' || p.status === 'Triagem' || p.status === 'Pendência',
  ).length
  const approvedCount = processes.filter((p) => p.result === 'approved').length
  const rejectedCount = processes.filter((p) => p.result === 'rejected').length
  const inProgressCount = processes.length - pendingCount - approvedCount - rejectedCount

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Painel da Imobiliária</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o desempenho e os processos da sua agência.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Corretores
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{brokersCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Processos
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{processes.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processos em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processos Aprovados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
