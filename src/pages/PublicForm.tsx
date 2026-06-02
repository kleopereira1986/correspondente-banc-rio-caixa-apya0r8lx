import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Landmark, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

const formSchema = z.object({
  name: z.string().min(3, 'Nome completo é obrigatório'),
  cpf: z.string().min(14, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(14, 'Telefone inválido'),
  marital_status: z.string().min(1, 'Selecione o estado civil'),
  income: z.string().min(1, 'Renda é obrigatória'),
  has_dependents: z.boolean(),
  work_history_36_months: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

export default function PublicForm() {
  const [searchParams] = useSearchParams()
  const broker = searchParams.get('broker') || ''
  const type = searchParams.get('type') || 'credit'

  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      has_dependents: false,
      work_history_36_months: false,
      marital_status: '',
    },
  })

  const applyCpfMask = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const applyPhoneMask = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const applyCurrencyMask = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    const amount = parseInt(numbers) / 100
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setServerError('')
    try {
      const payload = {
        name: data.name,
        cpf: data.cpf.replace(/\D/g, ''),
        email: data.email,
        phone: data.phone.replace(/\D/g, ''),
        marital_status: data.marital_status,
        income: parseFloat(data.income.replace(/\D/g, '')) / 100,
        has_dependents: data.has_dependents,
        work_history_36_months: data.work_history_36_months,
        broker,
        type,
      }

      await pb.send('/backend/v1/external-submit', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })

      setIsSuccess(true)
    } catch (err: any) {
      setServerError(err?.message || 'Ocorreu um erro ao processar sua solicitação.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-md text-center border-none shadow-xl">
          <CardHeader className="pt-8">
            <div className="mx-auto bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-slate-800">Tudo Certo!</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <p className="text-slate-600 text-lg">
              Recebemos seus dados com sucesso. Um de nossos especialistas entrará em contato em
              breve para dar continuidade ao seu processo.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-xl mb-8 flex flex-col items-center justify-center text-primary font-bold text-2xl tracking-tight">
        <div className="bg-primary text-white p-3 rounded-xl mb-4 shadow-sm">
          <Landmark size={32} />
        </div>
        <span className="text-slate-800">CCA Digital</span>
      </div>

      <Card className="w-full max-w-xl shadow-xl border-t-4 border-t-primary/80 border-x-0 border-b-0 sm:border-x sm:border-b">
        <CardHeader className="text-center sm:text-left space-y-2">
          <CardTitle className="text-2xl">Cadastro de Cliente</CardTitle>
          <CardDescription className="text-base">
            Preencha os dados abaixo para iniciar sua análise de{' '}
            {type === 'housing' ? 'financiamento habitacional' : 'crédito'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="public-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in zoom-in-95">
                {serverError}
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="name" className="text-slate-700">
                Nome Completo *
              </Label>
              <Input
                id="name"
                placeholder="Digite seu nome completo"
                className="h-12 bg-white"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="cpf" className="text-slate-700">
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="h-12 bg-white"
                  {...register('cpf')}
                  onChange={(e) => {
                    e.target.value = applyCpfMask(e.target.value)
                    setValue('cpf', e.target.value, { shouldValidate: true })
                  }}
                />
                {errors.cpf && (
                  <p className="text-xs text-red-500 font-medium">{errors.cpf.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-slate-700">
                  WhatsApp / Telefone *
                </Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="h-12 bg-white"
                  {...register('phone')}
                  onChange={(e) => {
                    const masked = applyPhoneMask(e.target.value)
                    setValue('phone', masked, { shouldValidate: true })
                  }}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-slate-700">
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.melhor@email.com"
                className="h-12 bg-white"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="marital_status" className="text-slate-700">
                  Estado Civil *
                </Label>
                <Select onValueChange={(v) => setValue('marital_status', v)}>
                  <SelectTrigger className="h-12 bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                    <SelectItem value="União Estável">União Estável</SelectItem>
                  </SelectContent>
                </Select>
                {errors.marital_status && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.marital_status.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="income" className="text-slate-700">
                  Renda Mensal Bruta *
                </Label>
                <Input
                  id="income"
                  placeholder="R$ 0,00"
                  className="h-12 bg-white"
                  {...register('income')}
                  onChange={(e) => {
                    const masked = applyCurrencyMask(e.target.value)
                    setValue('income', masked, { shouldValidate: true })
                  }}
                />
                {errors.income && (
                  <p className="text-xs text-red-500 font-medium">{errors.income.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-5 border-t border-slate-100">
              <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Checkbox
                  id="has_dependents"
                  className="mt-1"
                  checked={watch('has_dependents')}
                  onCheckedChange={(checked) => setValue('has_dependents', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="has_dependents"
                    className="font-medium cursor-pointer text-slate-700"
                  >
                    Possui dependentes?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marque se você possui filhos ou outros dependentes legais.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Checkbox
                  id="work_history"
                  className="mt-1"
                  checked={watch('work_history_36_months')}
                  onCheckedChange={(checked) =>
                    setValue('work_history_36_months', checked as boolean)
                  }
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="work_history"
                    className="font-medium cursor-pointer text-slate-700 leading-tight"
                  >
                    Possui 36 meses ou mais de trabalho sob regime FGTS?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Somando todas as empresas que você já trabalhou na vida.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-slate-50 flex-col items-stretch p-6 sm:p-8 rounded-b-xl border-t border-slate-100">
          <Button
            type="submit"
            form="public-form"
            className="w-full h-14 text-base font-semibold group"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {isLoading ? 'Processando...' : 'Enviar Solicitação'}
            {!isLoading && (
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
          <p className="text-xs text-center text-slate-500 mt-5">
            Ao enviar, você concorda que seus dados serão utilizados com segurança e exclusivamente
            para fins de análise do seu processo.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
