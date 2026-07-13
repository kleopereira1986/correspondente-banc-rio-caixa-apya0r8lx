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

    if (body.from_step !== undefined && body.from_step !== null) {
      record.set('from_step', body.from_step)
    }
    if (body.to_step !== undefined && body.to_step !== null) {
      record.set('to_step', body.to_step)
    }
    if (body.from_status !== undefined && body.from_status !== null) {
      record.set('from_status', body.from_status)
    }
    if (body.to_status !== undefined && body.to_status !== null) {
      record.set('to_status', body.to_status)
    }

    $app.save(record)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
