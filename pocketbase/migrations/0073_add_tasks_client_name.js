migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    if (!col.fields.getByName('client_name')) {
      col.fields.add(new TextField({ name: 'client_name' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    if (col.fields.getByName('client_name')) {
      col.fields.removeByName('client_name')
    }
    app.save(col)
  },
)
