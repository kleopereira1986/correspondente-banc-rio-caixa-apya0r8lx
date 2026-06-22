import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/auth-context'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function AgencyBrokers() {
  const { user } = useAuth()
  const [brokers, setBrokers] = useState<any[]>([])

  useEffect(() => {
    if (!user?.real_estate_agency) return
    const fetchBrokers = async () => {
      try {
        const data = await pb.collection('users').getFullList({
          filter: `role = 'broker' && real_estate_agency = '${user.real_estate_agency}'`,
          sort: '-created',
        })
        setBrokers(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchBrokers()
  }, [user?.real_estate_agency])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Meus Corretores</h1>
        <p className="text-muted-foreground mt-1">
          Lista de todos os corretores vinculados à sua agência.
        </p>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Entrada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brokers.map((broker) => (
                <TableRow key={broker.id}>
                  <TableCell className="font-medium text-slate-800">
                    {broker.name || 'Sem nome'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{broker.email}</TableCell>
                  <TableCell className="text-muted-foreground">{broker.phone || '-'}</TableCell>
                  <TableCell>
                    {broker.is_approved ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-medium">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(broker.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {brokers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum corretor encontrado para a sua agência.
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
