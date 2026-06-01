import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { UploadCloud, Scan, Loader2, FileText, CheckCircle2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
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
import { Separator } from '@/components/ui/separator'
import { extractRgData, createUser } from '@/services/api'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  nome_completo: z.string().min(3, 'Nome muito curto'),
  cpf: z.string().min(11, 'CPF incompleto'),
  data_nascimento: z.string().optional(),
  data_expedicao: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function RgExtraction() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [extracted, setExtracted] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setExtracted(false)

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file)
      setExtracted(false)
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        setPreviewUrl(null)
      }
    } else {
      toast.error('Formato inválido. Envie JPG, PNG ou PDF.')
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleExtract = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo primeiro.')
      return
    }

    setIsExtracting(true)
    try {
      const base64 = await convertFileToBase64(selectedFile)
      const data = {
        fileBase64: base64,
        mimeType: selectedFile.type,
      }

      const result = await extractRgData(data)

      const cleanCpf = result.cpf ? result.cpf.replace(/\D/g, '') : ''

      setValue('nome_completo', result.nome_completo || '')
      setValue('cpf', cleanCpf)
      setValue('data_nascimento', result.data_nascimento || '')
      setValue('data_expedicao', result.data_expedicao || '')

      setExtracted(true)
      toast.success('Leitura concluída com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExtracting(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSaving(true)
    try {
      await createUser({
        name: data.nome_completo,
        cpf: data.cpf.replace(/\D/g, ''),
        role: 'buyer', // Automatically assigns as a buyer for the pipeline
      })
      toast.success('Cadastro criado com sucesso!')

      // Reset state
      setSelectedFile(null)
      setPreviewUrl(null)
      setExtracted(false)
      setValue('nome_completo', '')
      setValue('cpf', '')
      setValue('data_nascimento', '')
      setValue('data_expedicao', '')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Scan className="w-8 h-8 text-primary" />
          Emissão de Ficha via RG
        </h1>
        <p className="text-muted-foreground mt-1">
          Faça o upload do documento para preencher o cadastro automaticamente utilizando
          Inteligência Artificial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Column */}
        <Card className="shadow-sm border-border/50 h-fit">
          <CardHeader>
            <CardTitle>Documento de Identidade</CardTitle>
            <CardDescription>Formatos suportados: JPG, PNG, WEBP e PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-slate-50',
                selectedFile ? 'border-primary/50 bg-primary/5' : 'border-border',
              )}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
              />

              {previewUrl ? (
                <div className="space-y-4 flex flex-col items-center">
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-md shadow-sm" />
                  <p className="text-sm font-medium text-slate-700">{selectedFile?.name}</p>
                </div>
              ) : selectedFile ? (
                <div className="space-y-4 flex flex-col items-center">
                  <FileText className="w-16 h-16 text-primary" />
                  <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Clique para selecionar</p>
                    <p className="text-sm mt-1">ou arraste o arquivo até aqui</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full h-12 text-md shadow-sm"
              onClick={handleExtract}
              disabled={!selectedFile || isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando via IA...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-5 w-5" />
                  Executar Leitura de Documento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Column */}
        <Card className="shadow-sm border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Dados Extraídos
            </CardTitle>
            <CardDescription>Revise os dados antes de salvar o cadastro.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {isExtracting ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                  <Scan className="w-12 h-12 mb-4 opacity-20" />
                  <p>A IA está lendo o documento...</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome Completo</Label>
                    <Input
                      id="nome_completo"
                      placeholder="Ex: João da Silva"
                      {...register('nome_completo')}
                      className={cn(errors.nome_completo && 'border-red-500')}
                    />
                    {errors.nome_completo && (
                      <p className="text-sm text-red-500">{errors.nome_completo.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="Somente números"
                      {...register('cpf')}
                      className={cn(errors.cpf && 'border-red-500')}
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '')
                      }}
                    />
                    {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento"
                        placeholder="DD/MM/AAAA"
                        {...register('data_nascimento')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_expedicao">Data de Expedição</Label>
                      <Input
                        id="data_expedicao"
                        placeholder="DD/MM/AAAA"
                        {...register('data_expedicao')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <Separator />

            <CardFooter className="pt-6 bg-slate-50/50 rounded-b-xl">
              <Button
                type="submit"
                className="w-full"
                disabled={!extracted || isExtracting || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Salvar Cadastro / Emitir Ficha
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
