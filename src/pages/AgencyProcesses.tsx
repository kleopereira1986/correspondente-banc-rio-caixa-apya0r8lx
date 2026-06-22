import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/auth-context'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function AgencyProcesses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [processes, setProcesses] = useState<any[]>([])

  useEffect(() => {
    if (!user?.real_estate_agency) return
    const fetchProcesses = async () => {
      try {
        const data = await pb.collection('processes').getFullList({
          filter: `broker.real_estate_agency = '${user.real_estate_agency}'`,
          expand: 'buyer,broker',
          sort: '-created',
        })
        setProcesses(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchProcesses()
  }, [user?.real_estate_agency])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Processos da Agência</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe todos os processos conduzidos pelos corretores da sua agência.
        </p>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>ID / Cliente</TableHead>
                <TableHead>Corretor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((process) => (
                <TableRow
                  key={process.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/process/${process.id}`)}
                >
                  <TableCell>
                    <div className="font-medium text-slate-800 group-hover:text-primary">
                      {process.expand?.buyer?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">{process.id}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {process.expand?.broker?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {process.type === 'credit' ? (
                      <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                        Crédito
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-purple-600 bg-purple-50 border-purple-200"
                      >
                        Habitacional
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                    {formatCurrency(process.value)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium">
                      {process.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(process.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {processes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum processo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
