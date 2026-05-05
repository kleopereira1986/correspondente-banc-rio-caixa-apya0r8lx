migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.add(new DateField({ name: 'boleto_sent_at' }))
    col.fields.add(new DateField({ name: 'housing_finalized_at' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.removeByName('boleto_sent_at')
    col.fields.removeByName('housing_finalized_at')
    app.save(col)
  },
)
