migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('process_logs')
    const field = col.fields.getByName('process')
    if (field) {
      field.cascadeDelete = true
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('process_logs')
    const field = col.fields.getByName('process')
    if (field) {
      field.cascadeDelete = false
      app.save(col)
    }
  },
)
