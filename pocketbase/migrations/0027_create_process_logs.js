migrate(
  (app) => {
    const colId = app.findCollectionByNameOrId('processes').id
    const collection = new Collection({
      name: 'process_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'process', type: 'relation', required: true, collectionId: colId, maxSelect: 1 },
        { name: 'from_step', type: 'text' },
        { name: 'to_step', type: 'text' },
        { name: 'from_status', type: 'text' },
        { name: 'to_status', type: 'text' },
        { name: 'changed_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'note', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('process_logs'))
    } catch (_) {}
  },
)
