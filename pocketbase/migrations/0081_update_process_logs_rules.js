migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('process_logs')
    col.createRule = "@request.auth.id != ''"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('process_logs')
    col.createRule = null
    app.save(col)
  },
)
