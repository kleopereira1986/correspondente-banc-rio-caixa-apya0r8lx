routerAdd('POST', '/backend/v1/external-submit', (e) => {
  const body = e.requestInfo().body || {}

  const errors = {}

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors['name'] = new ValidationError('validation_required', 'Nome é obrigatório')
  }

  if (!body.email || typeof body.email !== 'string' || !/^\S+@\S+\.\S+$/.test(body.email)) {
    errors['email'] = new ValidationError('validation_invalid_email', 'Email inválido')
  }

  if (!body.cpf || typeof body.cpf !== 'string' || body.cpf.length < 11) {
    errors['cpf'] = new ValidationError('validation_invalid_cpf', 'CPF inválido')
  }

  if (!body.phone || typeof body.phone !== 'string' || body.phone.length < 10) {
    errors['phone'] = new ValidationError('validation_invalid_phone', 'Telefone inválido')
  }

  if (
    !body.marital_status ||
    typeof body.marital_status !== 'string' ||
    body.marital_status.trim() === ''
  ) {
    errors['marital_status'] = new ValidationError(
      'validation_required',
      'Estado civil é obrigatório',
    )
  }

  if (typeof body.income !== 'number' || body.income < 0) {
    errors['income'] = new ValidationError('validation_invalid_income', 'Renda inválida')
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestError('Dados inválidos', errors)
  }

  const data = {
    name: body.name,
    email: body.email,
    cpf: body.cpf,
    phone: body.phone,
    marital_status: body.marital_status,
    income: body.income,
    has_dependents: !!body.has_dependents,
    work_history_36_months: !!body.work_history_36_months,
    broker: body.broker,
    type: body.type === 'housing' ? 'housing' : 'credit',
  }

  let userRecord
  try {
    userRecord = $app.findAuthRecordByEmail('users', data.email)
  } catch (_) {
    try {
      const records = $app.findRecordsByFilter('users', `cpf = '${data.cpf}'`, '', 1, 0)
      if (records.length > 0) userRecord = records[0]
    } catch (_) {}
  }

  $app.runInTransaction((txApp) => {
    if (!userRecord) {
      const usersCol = txApp.findCollectionByNameOrId('users')
      userRecord = new Record(usersCol)
      userRecord.set('name', data.name)
      userRecord.setEmail(data.email)
      userRecord.setPassword($security.randomString(16))
      userRecord.setVerified(true)
      userRecord.set('cpf', data.cpf)
      userRecord.set('phone', data.phone)
      userRecord.set('marital_status', data.marital_status)
      userRecord.set('income', data.income)
      userRecord.set('has_dependents', data.has_dependents)
      userRecord.set('work_history_36_months', data.work_history_36_months)
      userRecord.set('role', 'buyer')
      txApp.save(userRecord)
    } else {
      userRecord.set('name', data.name)
      userRecord.set('phone', data.phone)
      userRecord.set('marital_status', data.marital_status)
      userRecord.set('income', data.income)
      userRecord.set('has_dependents', data.has_dependents)
      userRecord.set('work_history_36_months', data.work_history_36_months)
      txApp.save(userRecord)
    }

    let brokerId = null
    if (data.broker) {
      try {
        const brokerRecord = txApp.findRecordById('users', data.broker)
        if (brokerRecord) brokerId = brokerRecord.id
      } catch (_) {}
    }

    const processesCol = txApp.findCollectionByNameOrId('processes')
    const processRecord = new Record(processesCol)
    processRecord.set('type', data.type)
    processRecord.set('status', 'Novo Processo via Site')
    processRecord.set('result', 'pending')
    processRecord.set('buyer', userRecord.id)
    if (brokerId) {
      processRecord.set('broker', brokerId)
    }
    txApp.save(processRecord)
  })

  return e.json(200, { success: true })
})
