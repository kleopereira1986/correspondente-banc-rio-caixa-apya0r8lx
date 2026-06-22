/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.updateRule = "id = @request.auth.id || @request.auth.role = 'master'"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.updateRule = ''
    app.save(col)
  },
)
