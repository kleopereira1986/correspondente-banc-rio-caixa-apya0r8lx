migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('credit_document_types')
    col.fields.add(new BoolField({ name: 'is_active' }))
    app.save(col)

    app.db().newQuery('UPDATE credit_document_types SET is_active = 1').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('credit_document_types')
    col.fields.removeByName('is_active')
    app.save(col)
  },
)
