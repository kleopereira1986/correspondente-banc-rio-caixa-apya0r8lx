migrate(
  (app) => {
    const collection = new Collection({
      name: 'public_construction_updates',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'construction_company',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('construction_companies').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'process_id', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('public_construction_updates')
      app.delete(collection)
    } catch (_) {}
  },
)
