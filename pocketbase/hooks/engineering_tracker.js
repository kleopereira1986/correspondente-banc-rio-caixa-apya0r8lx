onRecordUpdateRequest((e) => {
  const originalStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (originalStatus !== newStatus) {
    if (newStatus === 'boleto_issued' && !e.record.getString('boleto_sent_at')) {
      e.record.set('boleto_sent_at', new Date().toISOString())
    }
    if (newStatus === 'completed' && !e.record.getString('finalized_at')) {
      e.record.set('finalized_at', new Date().toISOString())
    }

    const logsCol = $app.findCollectionByNameOrId('engineering_logs')
    const log = new Record(logsCol)
    log.set('request', e.record.id)
    log.set('from_status', originalStatus)
    log.set('to_status', newStatus)
    if (e.auth) {
      log.set('changed_by', e.auth.id)
    }
    $app.save(log)
  }

  e.next()
}, 'engineering_requests')
