onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original()
  const current = e.record

  const fromStatus = original.getString('status')
  const toStatus = current.getString('status')
  const fromStep = original.getString('current_step')
  const toStep = current.getString('current_step')

  if (fromStatus !== toStatus || fromStep !== toStep) {
    let skip = false
    try {
      const cutoff = new Date(Date.now() - 5000).toISOString().replace('T', ' ')
      const filter = `process = "${current.id}" && to_status = "${toStatus.replace(/"/g, '')}" && created >= "${cutoff}"`
      const existing = $app.findFirstRecordByFilter('process_logs', filter)
      if (existing) {
        skip = true
      }
    } catch (_) {}

    if (!skip) {
      const logsCol = $app.findCollectionByNameOrId('process_logs')
      const log = new Record(logsCol)
      log.set('process', current.id)
      log.set('from_step', fromStep)
      log.set('to_step', toStep)
      log.set('from_status', fromStatus)
      log.set('to_status', toStatus)
      log.set('changed_by', current.getString('last_updated_by') || '')
      $app.save(log)
    }
  }

  return e.next()
}, 'processes')
