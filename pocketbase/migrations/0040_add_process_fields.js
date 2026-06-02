migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.add(
      new RelationField({ name: 'buyer_2', collectionId: '_pb_users_auth_', maxSelect: 1 }),
    )
    col.fields.add(new NumberField({ name: 'property_purchase_value' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.removeByName('buyer_2')
    col.fields.removeByName('property_purchase_value')
    app.save(col)
  },
)
