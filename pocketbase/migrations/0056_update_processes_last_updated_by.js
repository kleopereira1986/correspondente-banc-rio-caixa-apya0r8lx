migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.add(
      new RelationField({
        name: 'last_updated_by',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.removeByName('last_updated_by')
    app.save(col)
  },
)
