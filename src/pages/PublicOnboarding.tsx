import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, Clock, AlertCircle, XCircle, UploadCloud } from 'lucide-react'

export default function PublicOnboarding() {
  const { id } = useParams()
  const { toast } = useToast()
  const [process, setProcess] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [workHistory, setWorkHistory] = useState(false)
  const [income, setIncome] = useState('')
  const [pis, setPis] = useState('')

  const [files, setFiles] = useState<Record<string, File | null>>({
    cnh: null,
    address: null,
    civil: null,
    payslip: null,
    ir: null,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const p = await pb.collection('processes').getOne(id!, { expand: 'buyer' })
        setProcess(p)
        if (p.expand?.buyer) {
          setName(p.expand.buyer.name || '')
          setCpf(p.expand.buyer.cpf || '')
          setMaritalStatus(p.expand.buyer.marital_status || '')
          setWorkHistory(p.expand.buyer.work_history_36_months || false)
          setIncome(p.expand.buyer.income?.toString() || '')
          setPis(p.expand.buyer.pis || '')
        }
      } catch (e) {
        toast({ title: 'Processo não encontrado', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, toast])

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [key]: e.target.files![0] }))
    }
  }

  const handleSubmit = async () => {
    if (!name || !cpf || !maritalStatus || !income || !pis) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }
    if (!files.cnh || !files.address || !files.civil || !files.payslip) {
      toast({ title: 'Envie todos os documentos obrigatórios', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      if (process.buyer) {
        await pb.collection('users').update(process.buyer, {
          name,
          cpf,
          marital_status: maritalStatus,
          work_history_36_months: workHistory,
          income: Number(income),
          pis,
        })
      }

      const uploadPromises = []
      const categories = {
        cnh: 'CNH OU RG',
        address: 'COMPRAVANTE DE ENDEREÇO ATUALIZADO',
        civil: 'CERTIDÃO DE NASCIMENTO OU CASAMENTO',
        payslip: 'HOLERITE',
        ir: 'IMPOSTO DE RENDA ( OPCIONAL)',
      }

      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const fd = new FormData()
          fd.append('process', process.id)
          fd.append('name', file.name)
          fd.append('category', categories[key as keyof typeof categories])
          fd.append('file', file)
          fd.append('status', 'pending')
          uploadPromises.push(pb.collection('documents').create(fd))
        }
      }
      await Promise.all(uploadPromises)

      const updated = await pb.collection('processes').update(process.id, {
        status: 'Conferral and Analysis',
        current_step: 'Conferral and Analysis',
      })
      setProcess(updated)
      toast({ title: 'Dados enviados com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao enviar dados', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-muted-foreground font-medium">Carregando...</div>
      </div>
    )
  if (!process)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-destructive font-medium">Processo inválido ou não encontrado.</div>
      </div>
    )

  const isSubmitted = process.status !== 'Awaiting Registration'

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-slate-800">Status do Processo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8 space-y-6">
              <div className="p-6 bg-slate-100 rounded-full">
                {process.result === 'approved' && (
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                )}
                {process.result === 'rejected' && (
                  <XCircle className="w-16 h-16 text-destructive" />
                )}
                {process.result === 'conditioned' && (
                  <AlertCircle className="w-16 h-16 text-yellow-500" />
                )}
                {process.result === 'pending' && <Clock className="w-16 h-16 text-blue-500" />}
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">
                  {process.result === 'approved'
                    ? 'APROVADO'
                    : process.result === 'rejected'
                      ? 'REPROVADO'
                      : process.result === 'conditioned'
                        ? 'CONDICIONADO'
                        : process.status === 'Pendência'
                          ? 'PENDÊNCIA'
                          : 'EM ANÁLISE'}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Seus dados foram recebidos e estão sendo processados. Acompanhe o status da sua
                  avaliação de crédito por esta página.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Bem-vindo à sua Avaliação
          </h1>
          <p className="text-muted-foreground">
            Preencha seus dados e envie os documentos necessários para iniciar a análise de crédito.
          </p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 bg-white/50">
            <CardTitle>Dados Pessoais e Financeiros</CardTitle>
            <CardDescription>Informações necessárias para a avaliação</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>nome completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label>cpf</Label>
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>estado civil:</Label>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                    <SelectItem value="União Estável">União Estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>renda</Label>
                <Input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="Ex: 3500.00"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>numero do pis</Label>
                <Input
                  value={pis}
                  onChange={(e) => setPis(e.target.value)}
                  placeholder="Seu número do PIS"
                />
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border p-4 sm:col-span-2 bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    tem mais de 36 meses de carteira assinada somando todos trabalhos?
                  </Label>
                </div>
                <Switch checked={workHistory} onCheckedChange={setWorkHistory} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 bg-white/50">
            <CardTitle>Envio de Documentos</CardTitle>
            <CardDescription>Faça o upload dos documentos solicitados</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[
              { id: 'cnh', label: 'CNH OU RG', req: true },
              { id: 'address', label: 'COMPRAVANTE DE ENDEREÇO ATUALIZADO', req: true },
              { id: 'civil', label: 'CERTIDÃO DE NASCIMENTO OU CASAMENTO', req: true },
              { id: 'payslip', label: 'HOLERITE', req: true },
              { id: 'ir', label: 'IMPOSTO DE RENDA ( OPCIONAL)', req: false },
            ].map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-slate-50/50 gap-4"
              >
                <div>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    {doc.label}{' '}
                    {doc.req && <span className="text-xs font-bold text-destructive">*</span>}
                  </p>
                  {files[doc.id] && (
                    <p className="text-sm text-emerald-600 mt-1 font-medium truncate max-w-[200px] sm:max-w-xs">
                      {files[doc.id]?.name}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <Label
                    htmlFor={`file-${doc.id}`}
                    className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />{' '}
                    {files[doc.id] ? 'Trocar Arquivo' : 'Selecionar'}
                  </Label>
                  <input
                    id={`file-${doc.id}`}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(doc.id, e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 text-lg shadow-sm"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Enviando...' : 'Enviar Dados'}
        </Button>
      </div>
    </div>
  )
}
