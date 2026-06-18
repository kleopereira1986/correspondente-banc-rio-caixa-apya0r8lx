migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.add(
      new RelationField({
        name: 'real_estate_agency',
        collectionId: app.findCollectionByNameOrId('real_estate_agencies').id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.removeByName('real_estate_agency')
    app.save(col)
  },
)
