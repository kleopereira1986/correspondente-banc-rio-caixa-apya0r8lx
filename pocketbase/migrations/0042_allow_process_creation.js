migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.createRule = ''
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.createRule = "@request.auth.id != ''"
    app.save(col)
  },
)
