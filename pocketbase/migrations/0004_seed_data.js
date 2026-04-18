migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUser = (email, name, role) => {
      try {
        return app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const record = new Record(users)
        record.setEmail(email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', name)
        record.set('role', role)
        app.save(record)
        return record
      }
    }

    const master = seedUser('kleopereira1986@gmail.com', 'Admin Master', 'master')
    const analyst = seedUser('analista@caixa.gov.br', 'Carlos Santos', 'analyst')
    const analyst2 = seedUser('analista2@caixa.gov.br', 'Maria Silva', 'analyst')
    const buyer = seedUser('roberto@email.com', 'Roberto Almeida', 'buyer')
    const seller = seedUser('juliana@email.com', 'Juliana Costa', 'seller')

    const processes = app.findCollectionByNameOrId('processes')
    try {
      app.findFirstRecordByData('processes', 'buyer', buyer.id)
    } catch (_) {
      const p1 = new Record(processes)
      p1.set('type', 'credit')
      p1.set('status', 'Registration')
      p1.set('buyer', buyer.id)
      p1.set('assigned_analyst', analyst.id)
      p1.set('observations', 'Cliente deseja financiar imóvel na planta.')
      p1.set('current_step', 'Registration')
      p1.set('value', 350000)
      p1.set('result', 'pending')
      app.save(p1)

      const p2 = new Record(processes)
      p2.set('type', 'housing')
      p2.set('status', 'Documentação')
      p2.set('buyer', buyer.id)
      p2.set('seller', seller.id)
      p2.set('assigned_analyst', analyst.id)
      p2.set('current_step', 'Documentação')
      p2.set('value', 450000)
      app.save(p2)
    }
  },
  (app) => {},
)
