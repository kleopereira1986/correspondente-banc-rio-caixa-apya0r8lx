migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')

    if (!col.fields.getByName('cef_unlock_date')) {
      col.fields.add(new DateField({ name: 'cef_unlock_date' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.removeByName('cef_unlock_date')
    app.save(col)
  },
)
