migrate(
  (app) => {
    const devTypesCol = new Collection({
      name: 'development_types',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'master'",
      updateRule: "@request.auth.role = 'master'",
      deleteRule: "@request.auth.role = 'master'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(devTypesCol)

    const usersCol = app.findCollectionByNameOrId('users')
    usersCol.fields.add(new TextField({ name: 'phone' }))
    usersCol.fields.add(new BoolField({ name: 'has_dependents' }))
    usersCol.fields.add(new TextField({ name: 'dependents_info' }))
    app.save(usersCol)

    const processesCol = app.findCollectionByNameOrId('processes')
    processesCol.fields.add(
      new RelationField({ name: 'development_type', collectionId: devTypesCol.id, maxSelect: 1 }),
    )
    app.save(processesCol)
  },
  (app) => {
    const processesCol = app.findCollectionByNameOrId('processes')
    processesCol.fields.removeByName('development_type')
    app.save(processesCol)

    const usersCol = app.findCollectionByNameOrId('users')
    usersCol.fields.removeByName('phone')
    usersCol.fields.removeByName('has_dependents')
    usersCol.fields.removeByName('dependents_info')
    app.save(usersCol)

    const devTypesCol = app.findCollectionByNameOrId('development_types')
    app.delete(devTypesCol)
  },
)
