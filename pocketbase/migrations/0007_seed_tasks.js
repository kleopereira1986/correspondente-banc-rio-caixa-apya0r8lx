migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Create a broker user for testing
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'broker@example.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('broker@example.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Corretor Parceiro')
      record.set('role', 'broker')
      app.save(record)
    }

    // Task types
    const typesCol = app.findCollectionByNameOrId('task_types')
    const types = [
      { name: 'Análise de Crédito', description: 'Solicitar análise de crédito para um cliente.' },
      { name: 'Avaliação de Imóvel', description: 'Solicitar avaliação de engenharia do imóvel.' },
      {
        name: 'Emissão de Contrato',
        description: 'Solicitar emissão do contrato de financiamento.',
      },
    ]

    for (const t of types) {
      try {
        app.findFirstRecordByData('task_types', 'name', t.name)
      } catch (_) {
        const record = new Record(typesCol)
        record.set('name', t.name)
        record.set('description', t.description)
        app.save(record)
      }
    }
  },
  (app) => {},
)
