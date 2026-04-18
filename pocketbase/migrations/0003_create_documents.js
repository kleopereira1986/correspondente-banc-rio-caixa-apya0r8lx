migrate(
  (app) => {
    const processesId = app.findCollectionByNameOrId('processes').id
    const collection = new Collection({
      name: 'documents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'master' || uploaded_by = @request.auth.id",
      fields: [
        {
          name: 'process',
          type: 'relation',
          collectionId: processesId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { name: 'file', type: 'file', maxSelect: 1, maxSize: 10485760 },
        { name: 'name', type: 'text', required: true },
        { name: 'uploaded_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'category', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['pending', 'review', 'approved', 'rejected'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('documents')
    app.delete(collection)
  },
)
