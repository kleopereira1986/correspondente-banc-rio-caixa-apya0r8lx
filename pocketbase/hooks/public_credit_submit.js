routerAdd('POST', '/backend/v1/public-credit-submit', (e) => {
  const body = e.requestInfo().body || {}

  const property = body.property || {}
  const b1 = body.buyer1
  const b2 = body.buyer2

  if (!b1 || !b1.name || !b1.cpf) {
    return e.badRequestError('O Comprador 1 precisa ter Nome e CPF preenchidos.')
  }

  const cpf1 = (b1.cpf || '').replace(/\D/g, '')
  const cpf2 = b2 && b2.cpf ? (b2.cpf || '').replace(/\D/g, '') : ''

  // --- CPF duplicate validation (block before any write to ensure process integrity) ---
  try {
    const existing1 = $app.findFirstRecordByData('users', 'cpf', cpf1)
    if (existing1) {
      return e.badRequestError(
        'Já existe um cliente com este CPF cadastrado no sistema sob o nome: ' +
          existing1.getString('name') +
          '.',
      )
    }
  } catch (_) {}

  if (cpf2) {
    try {
      const existing2 = $app.findFirstRecordByData('users', 'cpf', cpf2)
      if (existing2) {
        return e.badRequestError(
          'Já existe um cliente com este CPF cadastrado no sistema sob o nome: ' +
            existing2.getString('name') +
            '.',
        )
      }
    } catch (_) {}
  }

  let processId = null

  $app.runInTransaction((txApp) => {
    const createUser = (b) => {
      const usersCol = txApp.findCollectionByNameOrId('users')
      const userRecord = new Record(usersCol)
      const safeEmail = (b.email || '').trim()
      const safeCpf = (b.cpf || '').replace(/\D/g, '')

      if (safeEmail) {
        userRecord.setEmail(safeEmail)
      }
      userRecord.setPassword($security.randomString(16))
      userRecord.setVerified(true)
      userRecord.set('role', 'buyer')
      userRecord.set('emailVisibility', true)
      userRecord.set('name', b.name)
      userRecord.set('cpf', safeCpf)
      if (b.pis) userRecord.set('pis', b.pis)
      if (b.phone) userRecord.set('phone', b.phone.replace(/\D/g, ''))
      if (b.marital_status) userRecord.set('marital_status', b.marital_status)
      if (b.education) userRecord.set('education', b.education)
      if (b.city) userRecord.set('city', b.city)
      if (b.state) userRecord.set('state', b.state)
      if (b.birth_date) {
        try {
          const parts = b.birth_date.split('/')
          if (parts.length === 3) {
            const d = parts[0]
            const m = parts[1]
            const y = parts[2]
            userRecord.set('birth_date', y + '-' + m + '-' + d + ' 12:00:00.000Z')
          }
        } catch (_) {}
      }

      userRecord.set('work_history_36_months', !!b.fgts_3_years)
      userRecord.set('has_dependents', !!b.has_dependents)
      userRecord.set('declared_tax', !!b.declared_tax)
      userRecord.set('is_first_property', !b.owns_property)

      txApp.save(userRecord)
      return userRecord
    }

    const user1 = createUser(b1)
    let user2 = null
    if (b2 && b2.name && b2.cpf) {
      user2 = createUser(b2)
    }

    const processesCol = txApp.findCollectionByNameOrId('processes')
    const processRecord = new Record(processesCol)

    processRecord.set('type', 'credit')
    processRecord.set('status', 'Novo Processo via Site')
    processRecord.set('result', 'pending')
    processRecord.set('buyer', user1.id)

    if (user2) {
      processRecord.set('buyer_2', user2.id)
    }

    if (body.usuario) {
      try {
        const brokerRecord = txApp.findRecordById('users', body.usuario)
        if (brokerRecord) {
          if (brokerRecord.getString('role') === 'analyst') {
            processRecord.set('assigned_analyst', brokerRecord.id)
          } else {
            processRecord.set('broker', brokerRecord.id)
          }
        }
      } catch (_) {}
    }

    const val = Number(property.purchase_value) || 0
    processRecord.set('value', val)
    processRecord.set('property_purchase_value', val)
    processRecord.set('amortization_system', property.amortization_system || '')
    processRecord.set(
      'has_defined_property',
      property.has_property === 'sim' || property.has_property === 'yes',
    )
    processRecord.set(
      'finance_costs',
      property.finance_costs === 'sim' || property.finance_costs === 'yes',
    )
    processRecord.set('desired_term', Number(property.desired_term) || 0)
    processRecord.set('property_observations', property.observations || '')

    try {
      if (property.type_option) {
        const propType = txApp.findFirstRecordByData('property_types', 'name', property.type_option)
        if (propType) {
          processRecord.set('property_type', propType.id)
        }
      }
    } catch (_) {}

    let obs = 'Correspondente: ' + (body.correspondente || 'N/A') + '\n'
    obs += 'Opção: ' + (property.type_option || 'N/A') + '\n'

    if (b1.observations) obs += '\nObs Comprador 1: ' + b1.observations + '\n'
    if (b2 && b2.observations) obs += '\nObs Comprador 2: ' + b2.observations + '\n'

    processRecord.set('observations', obs.trim())
    processRecord.set('additional_details', JSON.stringify({ checklist: body.checklist }))

    txApp.save(processRecord)
    processId = processRecord.id
  })

  return e.json(200, { success: true, processId })
})
