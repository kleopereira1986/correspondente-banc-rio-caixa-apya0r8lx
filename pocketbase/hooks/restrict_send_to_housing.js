onRecordUpdateRequest((e) => {
  const originalType = e.record.original().getString('type')
  const newType = e.record.getString('type')

  if (originalType === 'credit' && newType === 'housing') {
    const role = e.auth?.getString('role')
    if (role === 'broker') {
      throw new ForbiddenError(
        'Corretores não têm permissão para enviar processos para habitacional.',
      )
    }
  }

  e.next()
}, 'processes')
