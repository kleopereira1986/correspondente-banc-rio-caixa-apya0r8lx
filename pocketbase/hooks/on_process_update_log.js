onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = record.original()

  const fromStep = original.getString('current_step') || ''
  const toStep = record.getString('current_step') || ''
  const fromStatus = original.getString('status') || ''
  const toStatus = record.getString('status') || ''

  if (fromStep !== toStep || fromStatus !== toStatus) {
    const logsCol = $app.findCollectionByNameOrId('process_logs')
    const log = new Record(logsCol)
    log.set('process', record.id)
    log.set('from_step', fromStep)
    log.set('to_step', toStep)
    log.set('from_status', fromStatus)
    log.set('to_status', toStatus)
    log.set('changed_by', e.auth ? e.auth.id : null)
    log.set('note', record.getString('observations'))
    $app.saveNoValidate(log)
  }

  e.next()
}, 'processes')
