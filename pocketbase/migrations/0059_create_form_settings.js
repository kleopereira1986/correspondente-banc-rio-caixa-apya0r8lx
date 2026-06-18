migrate(
  (app) => {
    const col = new Collection({
      name: 'form_settings',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.role = "master"',
      updateRule: '@request.auth.role = "master"',
      deleteRule: '@request.auth.role = "master"',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'key', type: 'text', required: true },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('form_settings')
      app.delete(col)
    } catch (_) {}
  },
)
