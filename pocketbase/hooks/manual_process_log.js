routerAdd(
  'POST',
  '/backend/v1/process-logs/manual',
  (e) => {
    const body = e.requestInfo().body || {}
    const processId = body.process
    const note = body.note

    if (!processId || !note) {
      return e.badRequestError('Process ID and note are required')
    }

    const userId = e.auth?.id
    if (!userId) {
      return e.unauthorizedError('Auth required')
    }

    try {
      const processRecord = $app.findRecordById('processes', processId)

      const logCollection = $app.findCollectionByNameOrId('process_logs')
      const log = new Record(logCollection)

      log.set('process', processId)
      log.set('changed_by', userId)
      log.set('note', note)
      log.set('from_status', processRecord.getString('status'))
      log.set('to_status', processRecord.getString('status'))
      log.set('from_step', processRecord.getString('current_step'))
      log.set('to_step', processRecord.getString('current_step'))

      $app.save(log)

      return e.json(200, { success: true, id: log.id })
    } catch (err) {
      return e.badRequestError('Processo não encontrado ou erro ao salvar: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
