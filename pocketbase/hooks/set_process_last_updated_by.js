onRecordUpdateRequest((e) => {
  if (e.auth) {
    e.record.set('last_updated_by', e.auth.id)
  }
  e.next()
}, 'processes')
