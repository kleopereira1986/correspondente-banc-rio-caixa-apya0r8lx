routerAdd(
  'POST',
  '/backend/v1/process-logs/manual',
  (e) => {
    const body = e.requestInfo().body
    if (!body || !body.process || !body.note) {
      return e.badRequestError('Process ID and note are required')
    }

    const userId = e.auth?.id
    if (!userId) {
      return e.unauthorizedError('Auth required')
    }

    let processRecord
    try {
      processRecord = $app.findRecordById('processes', body.process)
    } catch (_) {
      return e.notFoundError('Process not found')
    }

    const rule = processRecord.collection().viewRule
    if (rule) {
      const canAccess = $app.canAccessRecord(processRecord, e.requestInfo(), rule)
      if (!canAccess) {
        return e.forbiddenError('Not allowed to access this process')
      }
    }

    const collection = $app.findCollectionByNameOrId('process_logs')
    const record = new Record(collection)

    record.set('process', body.process)
    record.set('note', body.note)
    record.set('changed_by', userId)

    $app.save(record)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
