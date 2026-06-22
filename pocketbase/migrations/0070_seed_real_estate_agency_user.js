migrate(
  (app) => {
    // 1. Create a dummy real_estate_agency record if it doesn't exist
    const agenciesCol = app.findCollectionByNameOrId('real_estate_agencies')
    let agency
    try {
      agency = app.findFirstRecordByData('real_estate_agencies', 'name', 'Agência Teste')
    } catch (_) {
      agency = new Record(agenciesCol)
      agency.set('name', 'Agência Teste')
      app.save(agency)
    }

    // 2. Create the real_estate_agency user
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'imobiliaria_test@example.com')
      // User already exists, ignore
    } catch (_) {
      const user = new Record(usersCol)
      user.setEmail('imobiliaria_test@example.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Imobiliária Teste')
      user.set('role', 'real_estate_agency')
      user.set('is_approved', true)
      user.set('real_estate_agency', agency.id)
      app.save(user)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'imobiliaria_test@example.com')
      app.delete(record)
    } catch (_) {}
  },
)
