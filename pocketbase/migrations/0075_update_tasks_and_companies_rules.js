migrate(
  (app) => {
    // 1. Update tasks rules
    const tasksCol = app.findCollectionByNameOrId('tasks')
    const tasksRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || requester = @request.auth.id || (@request.auth.role = 'real_estate_agency' && requester.real_estate_agency = @request.auth.real_estate_agency))"
    tasksCol.listRule = tasksRule
    tasksCol.viewRule = tasksRule
    app.save(tasksCol)

    // 2. Update construction_companies rules
    const ccCol = app.findCollectionByNameOrId('construction_companies')
    const ccRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || @request.auth.role = 'real_estate_agency')"
    ccCol.listRule = ccRule
    ccCol.viewRule = ccRule
    app.save(ccCol)
  },
  (app) => {
    try {
      const tasksCol = app.findCollectionByNameOrId('tasks')
      const oldTasksRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || requester = @request.auth.id)"
      tasksCol.listRule = oldTasksRule
      tasksCol.viewRule = oldTasksRule
      app.save(tasksCol)
    } catch (_) {}

    try {
      const ccCol = app.findCollectionByNameOrId('construction_companies')
      const oldCcRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')"
      ccCol.listRule = oldCcRule
      ccCol.viewRule = oldCcRule
      app.save(ccCol)
    } catch (_) {}
  },
)
