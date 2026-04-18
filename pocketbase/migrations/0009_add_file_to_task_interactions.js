migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('task_interactions')
    col.fields.add(
      new FileField({
        name: 'file',
        maxSelect: 10,
        maxSize: 52428800,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('task_interactions')
    col.fields.removeByName('file')
    app.save(col)
  },
)
