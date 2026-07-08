onRecordUpdateRequest((e) => {
  const originalType = e.record.original().getString('type')
  const newType = e.record.getString('type')

  if (originalType === 'credit' && newType === 'housing') {
    const role = e.auth?.getString('role')
    const allowedRoles = ['master', 'analyst', 'real_estate_agency']

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenError(
        'Seu perfil não tem permissão para enviar processos para habitacional.',
      )
    }
  }

  e.next()
}, 'processes')
