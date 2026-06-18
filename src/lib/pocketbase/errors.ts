import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  }

  if (error.status === 403) return 'Você não tem permissão para realizar esta ação.'
  if (error.status === 0) return 'Erro de rede. Verifique sua conexão com a internet.'

  if (error.status === 400 && Object.keys(error.response?.data || {}).length === 0) {
    const msg = error.response?.message
    if (msg === 'Failed to create record.')
      return 'Falha ao criar registro. Verifique suas permissões e dados.'
    if (msg === 'Failed to update record.')
      return 'Falha ao atualizar registro. Verifique suas permissões e dados.'
    if (msg === 'Failed to delete record.')
      return 'Falha ao excluir registro. Verifique suas permissões.'
    return msg || 'Erro de validação ou permissão. Verifique os dados enviados.'
  }

  const msgs = Object.values(extractFieldErrors(error))
  return msgs.length > 0 ? msgs.join(' ') : error.message || 'Ocorreu um erro inesperado.'
}
