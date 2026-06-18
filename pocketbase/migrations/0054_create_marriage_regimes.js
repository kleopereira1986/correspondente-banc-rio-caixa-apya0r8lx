migrate(
  (app) => {
    const collection = new Collection({
      name: 'marriage_regimes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'master' || @request.auth.role = 'analyst'",
      updateRule: "@request.auth.role = 'master' || @request.auth.role = 'analyst'",
      deleteRule: "@request.auth.role = 'master'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('marriage_regimes')
    app.delete(collection)
  },
)
