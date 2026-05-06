migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')

    if (!col.fields.getByName('federal_subsidy')) {
      col.fields.add(new NumberField({ name: 'federal_subsidy' }))
    }
    if (!col.fields.getByName('amortization_system')) {
      col.fields.add(
        new SelectField({ name: 'amortization_system', values: ['PRICE', 'SAC'], maxSelect: 1 }),
      )
    }
    if (!col.fields.getByName('approval_file')) {
      col.fields.add(new FileField({ name: 'approval_file', maxSelect: 1, maxSize: 10485760 }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.removeByName('federal_subsidy')
    col.fields.removeByName('amortization_system')
    col.fields.removeByName('approval_file')
    app.save(col)
  },
)
