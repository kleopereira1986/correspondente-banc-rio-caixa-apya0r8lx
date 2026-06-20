onRecordUpdateRequest((e) => {
  const isMaster = e.auth && e.auth.get('role') === 'master'
  if (!isMaster) {
    const original = e.record.original().getBool('is_approved')
    const current = e.record.getBool('is_approved')
    if (original !== current) {
      throw new ForbiddenError('Somente administradores podem alterar o status de aprovação.')
    }
  }
  e.next()
}, 'users')
