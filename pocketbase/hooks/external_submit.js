routerAdd('POST', '/backend/v1/external-submit', (e) => {
  const body = e.requestInfo().body || {}

  if (!body.buyer1 || !body.buyer1.name) {
    throw new BadRequestError('Dados do comprador 1 são obrigatórios', {
      name: new ValidationError('validation_required', 'Nome é obrigatório'),
    })
  }

  let processId = null

  $app.runInTransaction((txApp) => {
    const usersCol = txApp.findCollectionByNameOrId('users')
    const processesCol = txApp.findCollectionByNameOrId('processes')

    const processUser = (userData) => {
      if (!userData || !userData.name) return null
      let userRecord = null

      const email = userData.email?.trim()
      const cpf = userData.cpf?.replace(/\D/g, '')

      if (email) {
        try {
          userRecord = txApp.findAuthRecordByEmail('users', email)
        } catch (_) {}
      }

      if (!userRecord && cpf) {
        try {
          const records = txApp.findRecordsByFilter('users', `cpf = '${cpf}'`, '', 1, 0)
          if (records.length > 0) userRecord = records[0]
        } catch (_) {}
      }

      if (!userRecord) {
        userRecord = new Record(usersCol)
        if (email) userRecord.setEmail(email)
        else userRecord.setEmail(`${$security.randomString(8)}@placeholder.com`)
        userRecord.setPassword($security.randomString(16))
        userRecord.setVerified(true)
      }

      userRecord.set('name', userData.name)
      if (cpf) userRecord.set('cpf', cpf)
      if (userData.pis) userRecord.set('pis', userData.pis)
      if (userData.phone) userRecord.set('phone', userData.phone.replace(/\D/g, ''))
      if (userData.marital_status) userRecord.set('marital_status', userData.marital_status)
      if (userData.birth_date) userRecord.set('birth_date', userData.birth_date)
      if (userData.education) userRecord.set('education', userData.education)

      userRecord.set('work_history_36_months', !!userData.work_history_36_months)
      userRecord.set('has_dependents', !!userData.has_dependents)
      userRecord.set('declared_tax', !!userData.declared_tax)
      userRecord.set('is_first_property', !!userData.is_first_property)

      if (userData.city) userRecord.set('city', userData.city)
      if (userData.state) userRecord.set('state', userData.state)
      userRecord.set('role', 'buyer')

      txApp.save(userRecord)
      return userRecord.id
    }

    const buyer1Id = processUser(body.buyer1)
    const buyer2Id = body.buyer2 ? processUser(body.buyer2) : null

    let brokerId = null
    if (body.broker) {
      try {
        const brokerRecord = txApp.findRecordById('users', body.broker)
        if (brokerRecord) brokerId = brokerRecord.id
      } catch (_) {}
    }

    const processRecord = new Record(processesCol)
    processRecord.set('type', 'credit')
    processRecord.set('status', 'Novo Processo via Site')
    processRecord.set('result', 'pending')
    processRecord.set('buyer', buyer1Id)
    if (buyer2Id) processRecord.set('buyer_2', buyer2Id)
    if (brokerId) processRecord.set('broker', brokerId)

    if (body.property) {
      const pv = Number(body.property.purchase_value) || 0
      processRecord.set('property_purchase_value', pv)
      processRecord.set('value', pv)
      processRecord.set('amortization_system', body.property.amortization_system || '')

      let obs = `Correspondente: ${body.correspondent || ''}\n`
      obs += `Possui imóvel: ${body.property.has_property ? 'Sim' : 'Não'}\n`
      obs += `Opção: ${body.property.property_type || ''}\n`
      obs += `Financiar custas: ${body.property.finance_costs ? 'Sim' : 'Não'}\n`
      obs += `Prazo: ${body.property.term_months || ''} meses\n`
      obs += `Observações Imóvel: ${body.property.observations || ''}\n`

      if (body.checklist) {
        obs += `\nChecklist Documentos:\n`
        for (const [k, v] of Object.entries(body.checklist)) {
          obs += `- ${k}: ${v ? 'Sim' : 'Não'}\n`
        }
      }
      processRecord.set('observations', obs)
    }

    txApp.save(processRecord)
    processId = processRecord.id
  })

  return e.json(200, { success: true, process_id: processId })
})
