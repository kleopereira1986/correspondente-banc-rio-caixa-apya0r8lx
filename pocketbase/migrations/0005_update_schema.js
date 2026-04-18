migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new TextField({ name: 'cpf' }))
    users.fields.add(
      new SelectField({
        name: 'marital_status',
        values: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'],
        maxSelect: 1,
      }),
    )
    users.fields.add(new BoolField({ name: 'work_history_36_months' }))
    users.fields.add(new NumberField({ name: 'income' }))
    users.fields.add(new TextField({ name: 'pis' }))
    users.viewRule = ''
    users.updateRule = ''
    app.save(users)

    const processes = app.findCollectionByNameOrId('processes')
    processes.viewRule = ''
    processes.updateRule = ''
    app.save(processes)

    const docs = app.findCollectionByNameOrId('documents')
    docs.viewRule = ''
    docs.createRule = ''
    app.save(docs)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('cpf')
    users.fields.removeByName('marital_status')
    users.fields.removeByName('work_history_36_months')
    users.fields.removeByName('income')
    users.fields.removeByName('pis')
    users.viewRule = "@request.auth.id != ''"
    users.updateRule = 'id = @request.auth.id'
    app.save(users)

    const processes = app.findCollectionByNameOrId('processes')
    processes.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id)"
    processes.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id)"
    app.save(processes)

    const docs = app.findCollectionByNameOrId('documents')
    docs.viewRule = "@request.auth.id != ''"
    docs.createRule = "@request.auth.id != ''"
    app.save(docs)
  },
)
