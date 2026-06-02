// @deps zod@3.23.8
routerAdd('POST', '/backend/v1/external-submit', (e) => {
  const { z } = require('zod')
  const body = e.requestInfo().body || {}

  const schema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    cpf: z.string().min(11, 'CPF inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    marital_status: z.string().min(1, 'Estado civil é obrigatório'),
    income: z.number().min(0, 'Renda inválida'),
    has_dependents: z.boolean(),
    work_history_36_months: z.boolean(),
    broker: z.string().optional(),
    type: z.enum(['credit', 'housing']).default('credit'),
  })

  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = {}
    for (const issue of result.error.issues) {
      errors[issue.path[0]] = new ValidationError(issue.code, issue.message)
    }
    throw new BadRequestError('Dados inválidos', errors)
  }

  const data = result.data

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
