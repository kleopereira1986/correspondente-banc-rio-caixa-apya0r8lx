onRecordCreateRequest((e) => {
  const isMaster = e.auth && e.auth.get('role') === 'master'
  if (!isMaster) {
    e.record.set('is_approved', false)
  }
  e.next()
}, 'users')
