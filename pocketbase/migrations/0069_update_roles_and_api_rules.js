migrate(
  (app) => {
    // 1. Add 'real_estate_agency' role to users collection if missing
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    const values = roleField.values || []
    if (!values.includes('real_estate_agency')) {
      values.push('real_estate_agency')
      roleField.values = values
      app.save(usersCol)
    }

    // 2. Update 'processes' API Rules to allow 'real_estate_agency' users to view their agency processes
    const processesCol = app.findCollectionByNameOrId('processes')
    const allowedRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id || broker = @request.auth.id || (@request.auth.role = 'real_estate_agency' && broker.real_estate_agency = @request.auth.real_estate_agency))"

    processesCol.listRule = allowedRule
    processesCol.viewRule = allowedRule
    app.save(processesCol)
  },
  (app) => {
    // Rollback changes
    try {
      const processesCol = app.findCollectionByNameOrId('processes')
      const originalRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id || broker = @request.auth.id)"
      processesCol.listRule = originalRule
      processesCol.viewRule = originalRule
      app.save(processesCol)
    } catch (_) {}
  },
)
