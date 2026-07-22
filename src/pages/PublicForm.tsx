import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { CheckCircle2, Loader2, UploadCloud } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const YesNoRadio = ({ name, label, control }: { name: string; label: string; control: any }) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="space-y-2">
        <FormLabel className="text-slate-700 font-semibold leading-relaxed block">
          {label}
        </FormLabel>
        <FormControl>
          <RadioGroup
            onValueChange={field.onChange}
            value={field.value}
            className="flex gap-4 pt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`${name}-no`} />
              <Label htmlFor={`${name}-no`} className="font-normal text-slate-600 cursor-pointer">
                Não
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`${name}-yes`} />
              <Label htmlFor={`${name}-yes`} className="font-normal text-slate-600 cursor-pointer">
                Sim
              </Label>
            </div>
          </RadioGroup>
        </FormControl>
      </FormItem>
    )}
  />
)

const applyCpfMask = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
const applyPhoneMask = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
const applyCurrencyMask = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  return (parseInt(numbers) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
const parseCurrency = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  return numbers ? parseFloat(numbers) / 100 : 0
}
const applyDateMask = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4})\d+?$/, '$1')

const BuyerFields = ({
  prefix,
  form,
  marriageRegimes,
  settings,
}: {
  prefix: 'buyer1' | 'buyer2'
  form: any
  marriageRegimes: any[]
  settings: Record<string, boolean>
}) => {
  const maritalStatus = form.watch(`${prefix}.marital_status`)
  const isMarried = maritalStatus === 'Casado(a)' || maritalStatus === 'União Estável'
  const isVisible = (key: string) => settings[`buyer.${key}`] !== false

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <Label className="text-slate-700 font-semibold">
          Tipo<span className="text-red-500">*</span>
        </Label>
        <FormField
          control={form.control}
          name={`${prefix}.type`}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CPF" id={`${prefix}-cpf`} />
                <Label htmlFor={`${prefix}-cpf`} className="font-normal cursor-pointer">
                  CPF
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CNPJ" id={`${prefix}-cnpj`} />
                <Label htmlFor={`${prefix}-cnpj`} className="font-normal cursor-pointer">
                  CNPJ
                </Label>
              </div>
            </RadioGroup>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name={`${prefix}.cpf`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                CPF<span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="000.000.000-00"
                  maxLength={14}
                  {...field}
                  onChange={(e) => field.onChange(applyCpfMask(e.target.value))}
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isVisible('pis') && (
          <FormField
            control={form.control}
            name={`${prefix}.pis`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIS/NIS</FormLabel>
                <FormControl>
                  <Input placeholder="000.00000.00-0" {...field} className="bg-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name={`${prefix}.name`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>
                Nome completo<span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="João da Silva" {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isVisible('birth_date') && (
          <FormField
            control={form.control}
            name={`${prefix}.birth_date`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de nascimento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    {...field}
                    onChange={(e) => field.onChange(applyDateMask(e.target.value))}
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {isVisible('education') && (
          <FormField
            control={form.control}
            name={`${prefix}.education`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escolaridade</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Fundamental">Ensino Fundamental</SelectItem>
                    <SelectItem value="Médio">Ensino Médio</SelectItem>
                    <SelectItem value="Superior">Ensino Superior</SelectItem>
                    <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {isVisible('marital_status') && (
          <FormField
            control={form.control}
            name={`${prefix}.marital_status`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado civil</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                    <SelectItem value="União Estável">União Estável</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isMarried && isVisible('marriage_regime') && (
          <FormField
            control={form.control}
            name={`${prefix}.marriage_regime`}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Regime de Casamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione o regime..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {marriageRegimes.map((r) => (
                      <SelectItem key={r.id} value={r.name}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name={`${prefix}.email`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="seuemail@gmail.com"
                  type="email"
                  {...field}
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.phone`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(99) 99999-9999"
                  maxLength={15}
                  {...field}
                  onChange={(e) => field.onChange(applyPhoneMask(e.target.value))}
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 pt-2">
        {isVisible('fgts_3_years') && (
          <YesNoRadio
            control={form.control}
            name={`${prefix}.fgts_3_years`}
            label="Possui 3 (três) anos de recolhimento de FGTS?"
          />
        )}
        {isVisible('has_dependents') && (
          <YesNoRadio
            control={form.control}
            name={`${prefix}.has_dependents`}
            label="Tem dependentes?"
          />
        )}
        {isVisible('declared_tax') && (
          <YesNoRadio
            control={form.control}
            name={`${prefix}.declared_tax`}
            label="Declarou imposto de renda?"
          />
        )}
        {isVisible('owns_property') && (
          <YesNoRadio
            control={form.control}
            name={`${prefix}.owns_property`}
            label="Já possui imóvel próprio como casa ou apartamento?"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <FormField
          control={form.control}
          name={`${prefix}.city`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.state`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.observations`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

const ChecklistItem = ({
  doc,
  form,
  documentFiles,
  setDocumentFiles,
}: {
  doc: any
  form: any
  documentFiles: any
  setDocumentFiles: any
}) => {
  const name = `checklist.${doc.id}`
  const value = form.watch(name)

  return (
    <div className="space-y-3 p-5 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors">
      <YesNoRadio control={form.control} name={name} label={doc.name} />
      {value === 'yes' && (
        <div className="pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label className="text-sm text-slate-600 mb-2 block font-medium">
            Anexar arquivo(s):
          </Label>
          <Input
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                setDocumentFiles((prev: any) => ({
                  ...prev,
                  [doc.id]: [...(prev[doc.id] || []), ...Array.from(e.target.files!)],
                }))
              }
            }}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer h-12 pt-2"
          />
          {documentFiles[doc.id]?.length > 0 && (
            <ul className="mt-3 text-sm text-slate-500 space-y-2">
              {documentFiles[doc.id].map((f: File, i: number) => (
                <li
                  key={i}
                  className="flex justify-between items-center bg-slate-50 p-2.5 rounded-md border border-slate-100"
                >
                  <span className="truncate max-w-[80%] font-medium">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentFiles((prev: any) => ({
                        ...prev,
                        [doc.id]: prev[doc.id].filter((_: any, idx: number) => idx !== i),
                      }))
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function PublicForm() {
  const [searchParams] = useSearchParams()
  const correspondente = searchParams.get('correspondente') || 'CAPITAL CREDITO'
  const usuario = searchParams.get('usuario') || ''
  const formType = searchParams.get('form') || 'credit-analysis'

  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const [marriageRegimes, setMarriageRegimes] = useState<any[]>([])
  const [documentTypes, setDocumentTypes] = useState<any[]>([])
  const [formSettings, setFormSettings] = useState<Record<string, boolean>>({})
  const [documentFiles, setDocumentFiles] = useState<Record<string, File[]>>({})

  useEffect(() => {
    pb.collection('marriage_regimes').getFullList().then(setMarriageRegimes).catch(console.error)
    pb.collection('credit_document_types')
      .getFullList({ filter: 'is_active = true', sort: '+created' })
      .then(setDocumentTypes)
      .catch(console.error)
    pb.collection('form_settings')
      .getFullList()
      .then((res) => {
        const settingsMap = res.reduce(
          (acc, curr) => {
            acc[curr.key] = curr.is_active
            return acc
          },
          {} as Record<string, boolean>,
        )
        setFormSettings(settingsMap)
      })
      .catch(console.error)
  }, [])

  const form = useForm<any>({
    defaultValues: {
      property: {
        has_property: 'no',
        purchase_value: '',
        type_option: 'Usado',
        finance_costs: 'no',
        desired_term: '',
        amortization_system: 'PRICE',
        observations: '',
      },
      buyer1: {
        type: 'CPF',
        cpf: '',
        pis: '',
        name: '',
        birth_date: '',
        education: '',
        marital_status: '',
        marriage_regime: '',
        email: '',
        phone: '',
        fgts_3_years: 'no',
        has_dependents: 'no',
        declared_tax: 'no',
        owns_property: 'no',
        city: '',
        state: '',
        observations: '',
      },
      has_buyer2: false,
      buyer2: {
        type: 'CPF',
        cpf: '',
        pis: '',
        name: '',
        birth_date: '',
        education: '',
        marital_status: '',
        marriage_regime: '',
        email: '',
        phone: '',
        fgts_3_years: 'no',
        has_dependents: 'no',
        declared_tax: 'no',
        owns_property: 'no',
        city: '',
        state: '',
        observations: '',
      },
      checklist: {},
    },
  })

  const hasBuyer2 = form.watch('has_buyer2')
  const isPropVisible = (key: string) => formSettings[`property.${key}`] !== false

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    setServerError('')
    try {
      const payload = {
        correspondente,
        usuario,
        formType,
        property: {
          ...data.property,
          has_property: data.property.has_property === 'yes',
          finance_costs: data.property.finance_costs === 'yes',
          purchase_value: parseCurrency(data.property.purchase_value),
        },
        buyer1: {
          ...data.buyer1,
          fgts_3_years: data.buyer1.fgts_3_years === 'yes',
          has_dependents: data.buyer1.has_dependents === 'yes',
          declared_tax: data.buyer1.declared_tax === 'yes',
          owns_property: data.buyer1.owns_property === 'yes',
        },
        buyer2: data.has_buyer2
          ? {
              ...data.buyer2,
              fgts_3_years: data.buyer2.fgts_3_years === 'yes',
              has_dependents: data.buyer2.has_dependents === 'yes',
              declared_tax: data.buyer2.declared_tax === 'yes',
              owns_property: data.buyer2.owns_property === 'yes',
            }
          : null,
        checklist: data.checklist,
      }

      const res = await pb.send('/backend/v1/public-credit-submit', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.processId) {
        // Complementary general files
        for (const file of files) {
          const fd = new FormData()
          fd.append('process', res.processId)
          fd.append('file', file)
          fd.append('name', file.name)
          fd.append('category', 'Outros')
          fd.append('status', 'pending')
          await pb.collection('documents').create(fd)
        }
        // Specific document files
        for (const [docId, docFiles] of Object.entries(documentFiles)) {
          const docType = documentTypes.find((d) => d.id === docId)
          for (const file of docFiles as File[]) {
            const fd = new FormData()
            fd.append('process', res.processId)
            fd.append('file', file)
            fd.append('name', docType?.name || 'Documento')
            fd.append('category', docType?.category || '1º Proponente')
            fd.append('status', 'pending')
            await pb.collection('documents').create(fd)
          }
        }
      }

      setIsSuccess(true)
    } catch (err) {
      setServerError(getErrorMessage(err))
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
            <CardTitle className="text-3xl text-slate-800">
              Solicitação enviada com sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <p className="text-slate-600 text-lg">
              Recebemos seus dados com sucesso. Em breve um de nossos consultores entrará em contato
              para dar seguimento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center py-10 px-4 sm:p-8 animate-in fade-in duration-500 font-sans">
      <div className="w-full max-w-3xl mb-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Formulário de solicitação de crédito
        </h1>
        <p className="text-slate-600">
          Preencha os dados para dar seguimento à sua solicitação de crédito.
        </p>
        <p className="text-slate-500 mt-2 font-medium">
          Correspondente:{' '}
          <span className="text-slate-800 font-bold uppercase">{correspondente}</span>
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            {serverError && (
              <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {serverError}
              </div>
            )}

            <div className="space-y-6">
              <YesNoRadio
                control={form.control}
                name="property.has_property"
                label="Possui imóvel definido?"
              />

              {isPropVisible('purchase_value') && (
                <FormField
                  control={form.control}
                  name="property.purchase_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">
                        Valor de compra do imóvel
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          className="bg-white h-11"
                          {...field}
                          onChange={(e) => field.onChange(applyCurrencyMask(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isPropVisible('type_option') && (
                <FormField
                  control={form.control}
                  name="property.type_option"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-slate-700 font-semibold">
                        Opção de compra é um imóvel:
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-wrap gap-4 sm:gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Usado" id="type-usado" />
                            <Label htmlFor="type-usado" className="font-normal cursor-pointer">
                              Usado
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Novo" id="type-novo" />
                            <Label htmlFor="type-novo" className="font-normal cursor-pointer">
                              Novo
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Na planta" id="type-planta" />
                            <Label htmlFor="type-planta" className="font-normal cursor-pointer">
                              Na planta (Crédito associativo)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Terreno/Construção" id="type-terreno" />
                            <Label htmlFor="type-terreno" className="font-normal cursor-pointer">
                              Terreno/Construção
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Outros" id="type-outros" />
                            <Label htmlFor="type-outros" className="font-normal cursor-pointer">
                              Outros
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {isPropVisible('finance_costs') && (
                <YesNoRadio
                  control={form.control}
                  name="property.finance_costs"
                  label="Tem interesse em financiar as custas/despesas do processo?"
                />
              )}

              {isPropVisible('desired_term') && (
                <FormField
                  control={form.control}
                  name="property.desired_term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">
                        Prazo desejado (meses)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="420"
                          type="number"
                          className="bg-white h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isPropVisible('amortization_system') && (
                <FormField
                  control={form.control}
                  name="property.amortization_system"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-slate-700 font-semibold">
                        Tipo de amortização
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PRICE" id="amort-price" />
                            <Label htmlFor="amort-price" className="font-normal cursor-pointer">
                              PRICE
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="SAC" id="amort-sac" />
                            <Label htmlFor="amort-sac" className="font-normal cursor-pointer">
                              SAC
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {isPropVisible('observations') && (
                <FormField
                  control={form.control}
                  name="property.observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">
                        Observações do imóvel
                      </FormLabel>
                      <FormControl>
                        <Textarea className="bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <hr className="border-slate-200" />

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Comprador 1</h2>
              <BuyerFields
                prefix="buyer1"
                form={form}
                marriageRegimes={marriageRegimes}
                settings={formSettings}
              />
            </div>

            <hr className="border-slate-200" />

            {!hasBuyer2 ? (
              <Button
                type="button"
                className="bg-[#1b365d] hover:bg-[#132641] text-white font-semibold rounded-md h-11 px-6"
                onClick={() => form.setValue('has_buyer2', true)}
              >
                ADICIONAR COMPRADOR 2
              </Button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Comprador 2</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => form.setValue('has_buyer2', false)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    Remover Comprador
                  </Button>
                </div>
                <BuyerFields
                  prefix="buyer2"
                  form={form}
                  marriageRegimes={marriageRegimes}
                  settings={formSettings}
                />
              </div>
            )}
            {!hasBuyer2 && (
              <p className="text-sm text-slate-500 -mt-8">
                (adicionar caso tenha mais de uma pessoa participante no processo ou se for casado)
              </p>
            )}

            <hr className="border-slate-200" />

            {/* Dynamic Documentation Checklist */}
            {documentTypes.length > 0 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Documentação</h2>
                  <p className="text-slate-600">
                    Indique quais documentos você possui no momento e anexe-os se possível para
                    agilizar sua análise. A documentação é separada por proponente.
                  </p>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-lg text-slate-800">
                      Documentação do 1º Proponente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {documentTypes.filter((doc) => doc.category === '1º Proponente').length > 0 ? (
                      documentTypes
                        .filter((doc) => doc.category === '1º Proponente')
                        .map((doc) => (
                          <ChecklistItem
                            key={doc.id}
                            doc={doc}
                            form={form}
                            documentFiles={documentFiles}
                            setDocumentFiles={setDocumentFiles}
                          />
                        ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum documento configurado para esta seção.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {hasBuyer2 && (
                  <Card className="border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="text-lg text-slate-800">
                        Documentação do 2º Proponente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {documentTypes.filter((doc) => doc.category === '2º Proponente / Conjuge')
                        .length > 0 ? (
                        documentTypes
                          .filter((doc) => doc.category === '2º Proponente / Conjuge')
                          .map((doc) => (
                            <ChecklistItem
                              key={doc.id}
                              doc={doc}
                              form={form}
                              documentFiles={documentFiles}
                              setDocumentFiles={setDocumentFiles}
                            />
                          ))
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Nenhum documento configurado para esta seção.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Additional Attachments */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Anexos Complementares</h2>
              <p className="text-slate-600 mb-6">
                Envie outros arquivos ou evidências complementares se necessário.
              </p>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center bg-white hover:bg-slate-50 transition-colors">
                <Input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => {
                    if (e.target.files)
                      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
                  }}
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-3 text-slate-600 w-full h-full"
                >
                  <UploadCloud className="w-10 h-10 text-slate-400" />
                  <div className="text-base">
                    <span className="font-semibold text-[#1b365d]">Enviar arquivos</span> ou arraste
                    e solte
                  </div>
                </Label>
                {files.length > 0 && (
                  <div className="mt-6 text-sm text-slate-600 text-left w-full max-w-lg mx-auto bg-slate-100 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Arquivos selecionados ({files.length}):</h4>
                    <ul className="space-y-1">
                      {files.map((f, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"
                        >
                          <span className="truncate max-w-[80%]">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold px-2"
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 pb-12">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-[#1b365d] hover:bg-[#132641] shadow-lg text-white"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {isLoading ? 'Enviando...' : 'ENVIAR SOLICITAÇÃO'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
