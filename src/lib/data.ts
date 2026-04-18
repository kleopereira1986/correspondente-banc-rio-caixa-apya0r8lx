export type ProcessStatus = 'Enviado' | 'Em Análise' | 'Pendente' | 'Aprovado' | 'Reprovado'

export interface Process {
  id: string
  clientName: string
  type: string
  status: ProcessStatus
  date: string
  value: number
}

export const mockProcesses: Process[] = [
  {
    id: 'PROC-001',
    clientName: 'Roberto Almeida',
    type: 'Financiamento Imobiliário',
    status: 'Em Análise',
    date: '2023-10-25',
    value: 350000,
  },
  {
    id: 'PROC-002',
    clientName: 'Maria Oliveira',
    type: 'Consórcio',
    status: 'Pendente',
    date: '2023-10-24',
    value: 120000,
  },
  {
    id: 'PROC-003',
    clientName: 'João Ferreira',
    type: 'Financiamento Imobiliário',
    status: 'Aprovado',
    date: '2023-10-22',
    value: 450000,
  },
  {
    id: 'PROC-004',
    clientName: 'Luciana Gomes',
    type: 'Empréstimo Pessoal',
    status: 'Enviado',
    date: '2023-10-26',
    value: 50000,
  },
  {
    id: 'PROC-005',
    clientName: 'Fernando Souza',
    type: 'Financiamento Imobiliário',
    status: 'Reprovado',
    date: '2023-10-20',
    value: 280000,
  },
]

export const mockDocuments = [
  {
    id: '1',
    name: 'Documento de Identidade (RG/CNH)',
    status: 'approved',
    url: 'https://img.usecurling.com/p/400/300?q=id%20card&color=blue',
  },
  {
    id: '2',
    name: 'Comprovante de Renda',
    status: 'pending',
    url: 'https://img.usecurling.com/p/400/300?q=document%20paper',
  },
  {
    id: '3',
    name: 'Comprovante de Residência',
    status: 'approved',
    url: 'https://img.usecurling.com/p/400/300?q=mail%20letter',
  },
  {
    id: '4',
    name: 'Matrícula do Imóvel',
    status: 'review',
    url: 'https://img.usecurling.com/p/400/300?q=house%20blueprint',
  },
]
