routerAdd(
  'POST',
  '/backend/v1/processes/{id}/resolve-pendency',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}
    const note = body.note

    if (!note || typeof note !== 'string' || !note.trim()) {
      return e.badRequestError('A descrição da resolução é obrigatória.')
    }

    const userId = e.auth?.id
    if (!userId) {
      return e.unauthorizedError('Não autorizado')
    }

    let process
    try {
      process = $app.findRecordById('processes', id)
    } catch (_) {
      return e.notFoundError('Processo não encontrado')
    }

    const fromStep = process.getString('current_step')
    const fromStatus = process.getString('status')

    $app.runInTransaction((txApp) => {
      // 1. Update the process
      process.set('result', 'pending')
      process.set('status', 'Aguardando Conferência')
      process.set('observations', 'Pendência resolvida pelo corretor/cliente')
      process.set('last_updated_by', userId)
      txApp.save(process)

      // 2. Create the process log with the note
      const logsCol = txApp.findCollectionByNameOrId('process_logs')
      const log = new Record(logsCol)
      log.set('process', id)
      log.set('from_step', fromStep)
      log.set('to_step', process.getString('current_step'))
      log.set('from_status', fromStatus)
      log.set('to_status', 'Aguardando Conferência')
      log.set('changed_by', userId)
      log.set('note', note.trim())

      txApp.save(log)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
