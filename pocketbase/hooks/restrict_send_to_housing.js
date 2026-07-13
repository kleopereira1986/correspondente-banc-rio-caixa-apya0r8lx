onRecordUpdateRequest((e) => {
  const originalType = e.record.original().getString('type')
  const newType = e.record.getString('type')

  const originalStep = e.record.original().getString('current_step')
  const newStep = e.record.getString('current_step')

  if (originalType === 'credit' && newType === 'housing') {
    const role = e.auth?.getString('role')
    const allowedRoles = ['master', 'analyst', 'broker']

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenError(
        'Seu perfil não tem permissão para enviar processos para habitacional.',
      )
    }
  }

  // Bug Fix - Flow Logic: prevent reverting a housing process back to credit
  if (originalType === 'housing' && newType === 'credit') {
    throw new BadRequestError(
      'Não é permitido reverter um processo habitacional para análise de crédito.',
    )
  }

  // Validação: requer construtora se for imóvel Novo ao entrar na Triagem CCA
  if (newType === 'housing' && originalType === 'credit') {
    const developmentTypeId = e.record.getString('development_type')
    if (developmentTypeId) {
      try {
        const devType = $app.findRecordById('development_types', developmentTypeId)
        if (
          devType.getString('name').toLowerCase() === 'novo' &&
          !e.record.getString('construction_company')
        ) {
          throw new BadRequestError(
            'Processo de imóvel Novo requer uma construtora vinculada. Edite o processo e vincule a construtora antes de enviar para o Kanban.',
          )
        }
      } catch (err) {
        if (err instanceof BadRequestError) {
          throw err
        }
      }
    }
  }

  e.next()
}, 'processes')
