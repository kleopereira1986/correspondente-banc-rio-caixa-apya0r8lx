migrate(
  (app) => {
    const collection = new Collection({
      name: 'processes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id)",
      deleteRule: "@request.auth.role = 'master'",
      fields: [
        {
          name: 'type',
          type: 'select',
          values: ['credit', 'housing'],
          maxSelect: 1,
          required: true,
        },
        { name: 'status', type: 'text', required: true },
        { name: 'buyer', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'seller', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'assigned_analyst',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'observations', type: 'text' },
        {
          name: 'result',
          type: 'select',
          values: ['approved', 'rejected', 'conditioned', 'pending'],
          maxSelect: 1,
        },
        { name: 'current_step', type: 'text' },
        { name: 'value', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('processes')
    app.delete(collection)
  },
)
