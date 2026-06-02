migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.fields.add(new BoolField({ name: 'is_first_property' }))
    users.fields.add(new BoolField({ name: 'declared_tax' }))
    users.fields.add(new TextField({ name: 'city' }))
    users.fields.add(new TextField({ name: 'state' }))
    users.fields.add(new TextField({ name: 'education' }))
    users.fields.add(new DateField({ name: 'birth_date' }))

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('is_first_property')
    users.fields.removeByName('declared_tax')
    users.fields.removeByName('city')
    users.fields.removeByName('state')
    users.fields.removeByName('education')
    users.fields.removeByName('birth_date')
    app.save(users)
  },
)
