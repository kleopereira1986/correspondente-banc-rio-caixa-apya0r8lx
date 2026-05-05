import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createEngineeringRequest } from '@/services/api'
import { useAuth } from '@/contexts/auth-context'
import { CheckCircle2, UploadCloud } from 'lucide-react'

const formSchema = z.object({
  requester_name: z.string().min(1, 'Obrigatório'),
  requester_cpf: z.string().optional(),
  requester_email: z.string().email('Email inválido'),
  seller_info: z.string().optional(),
  requested_value: z.string().optional(),
  evaluation_type: z.string().min(1, 'Obrigatório'),
  registration_number: z.string().optional(),
  block: z.string().optional(),
  area: z.string().optional(),
  billing_name: z.string().optional(),
  billing_email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Email inválido'),
  billing_phone: z.string().optional(),
  contact_person_name: z.string().optional(),
  contact_person_phone: z.string().optional(),
  documents: z.any().optional(),
})

const CustomField = ({ control, name, label, type = 'text' }: any) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input type={type} {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)

export default function EngineeringRequest() {
  const { user } = useAuth()
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requester_name: user?.name || '',
      requester_email: user?.email || '',
      requester_cpf: user?.cpf || '',
      seller_info: '',
      requested_value: '',
      evaluation_type: '',
      registration_number: '',
      block: '',
      area: '',
      billing_name: '',
      billing_email: '',
      billing_phone: '',
      contact_person_name: '',
      contact_person_phone: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(values).forEach(([k, v]) => {
        if (k === 'documents' && v?.[0]) formData.append(k, v[0])
        else if (v !== undefined && v !== null && k !== 'documents') formData.append(k, v as string)
      })
      await createEngineeringRequest(formData)
      setIsSuccess(true)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess)
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-in fade-in zoom-in duration-500">
        <Card className="border-green-200 bg-green-50 shadow-sm text-center pt-10 pb-10 flex flex-col items-center gap-4">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <h2 className="text-xl font-bold text-green-800 px-6">
            SUA AVALIAÇÃO FOI SOLICITADA COM SUCESSO! VOCÊ RECEBERA INFORMÇÕES NO SEU EMAIL E
            TELEFONE CADASTRADO.
          </h2>
          <Button
            onClick={() => {
              setIsSuccess(false)
              form.reset()
            }}
            variant="outline"
            className="mt-4 border-green-600 text-green-700 hover:bg-green-100"
          >
            Fazer nova solicitação
          </Button>
        </Card>
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-slate-800">SOLICITAÇÃO DE AVALIAÇÃO DE IMÓVEL</h1>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Solicitante</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomField control={form.control} name="requester_name" label="Nome" />
                  <CustomField control={form.control} name="requester_cpf" label="CPF" />
                  <CustomField
                    control={form.control}
                    name="requester_email"
                    label="Email"
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Imóvel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomField
                    control={form.control}
                    name="seller_info"
                    label="Construtora / Vendedor"
                  />
                  <CustomField
                    control={form.control}
                    name="requested_value"
                    label="Valor a Pedir de Avaliação"
                    type="number"
                  />
                  <FormField
                    control={form.control}
                    name="evaluation_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Avaliação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">IMÓVEL NOVO</SelectItem>
                            <SelectItem value="used">IMÓVEL USADO</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <CustomField
                    control={form.control}
                    name="registration_number"
                    label="Nº Matrícula do Imóvel"
                  />
                  <CustomField control={form.control} name="block" label="Quadra" />
                  <CustomField control={form.control} name="area" label="Área" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Para quem deve enviar o boleto
                  </h3>
                  <CustomField control={form.control} name="billing_name" label="Nome" />
                  <CustomField
                    control={form.control}
                    name="billing_email"
                    label="Email"
                    type="email"
                  />
                  <CustomField control={form.control} name="billing_phone" label="Telefone" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Quem irá acompanhar engenharia
                  </h3>
                  <CustomField control={form.control} name="contact_person_name" label="Nome" />
                  <CustomField
                    control={form.control}
                    name="contact_person_phone"
                    label="Telefone"
                  />
                  <FormField
                    control={form.control}
                    name="documents"
                    render={({ field: { value, onChange, ...p } }) => (
                      <FormItem className="pt-4">
                        <FormLabel>Documentações</FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 relative cursor-pointer transition-colors">
                            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-sm font-medium text-slate-600">
                              Clique para anexar arquivo
                            </span>
                            <span className="text-xs text-slate-400 mt-1">
                              Matrícula, IPTU, etc.
                            </span>
                            <Input
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => onChange(e.target.files)}
                              {...p}
                            />
                            {value?.[0] && (
                              <div className="mt-2 text-sm text-primary font-medium">
                                {value[0].name}
                              </div>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="pt-6 border-t flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? 'ENVIANDO...' : 'ENVIAR PEDIDO DE AVALIAÇÃO'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
