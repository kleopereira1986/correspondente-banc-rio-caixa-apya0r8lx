import { useEffect, useState } from 'react'
import { getEngineeringRequests } from '@/services/api'
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
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function EngineeringRequestsList() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRequests() {
      try {
        const data = await getEngineeringRequests()
        setRequests(data)
      } catch (error) {
        console.error('Error fetching engineering requests:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRequests()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Avaliações de Engenharia Solicitadas</h1>
        <p className="text-slate-500">
          Acompanhe todas as solicitações de avaliação de engenharia (internas e externas).
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Lista de Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Tipo de Avaliação</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                      Carregando solicitações...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                      Nenhuma solicitação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.requester_name}</TableCell>
                      <TableCell>{req.requester_cpf || '-'}</TableCell>
                      <TableCell>
                        {req.evaluation_type === 'new' ? 'Imóvel Novo' : 'Imóvel Usado'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(req.created), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {req.origin === 'external' ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                          >
                            Link Externo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600 bg-slate-50">
                            Interno
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
