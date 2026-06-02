migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.add(new BoolField({ name: 'is_first_property' }))
    col.fields.add(new BoolField({ name: 'declared_tax' }))
    col.fields.add(new TextField({ name: 'city' }))
    col.fields.add(new TextField({ name: 'state' }))
    col.fields.add(new TextField({ name: 'education' }))
    col.fields.add(new DateField({ name: 'birth_date' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.removeByName('is_first_property')
    col.fields.removeByName('declared_tax')
    col.fields.removeByName('city')
    col.fields.removeByName('state')
    col.fields.removeByName('education')
    col.fields.removeByName('birth_date')
    app.save(col)
  },
)
