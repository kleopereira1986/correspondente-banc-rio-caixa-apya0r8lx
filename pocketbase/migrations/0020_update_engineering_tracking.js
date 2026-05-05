migrate(
  (app) => {
    const reqCol = app.findCollectionByNameOrId('engineering_requests')

    if (!reqCol.fields.getByName('boleto_sent_at')) {
      reqCol.fields.add(new DateField({ name: 'boleto_sent_at' }))
    }
    if (!reqCol.fields.getByName('finalized_at')) {
      reqCol.fields.add(new DateField({ name: 'finalized_at' }))
    }

    app.save(reqCol)

    let logsCol
    try {
      logsCol = app.findCollectionByNameOrId('engineering_logs')
    } catch (_) {
      logsCol = new Collection({
        name: 'engineering_logs',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'request',
            type: 'relation',
            required: true,
            collectionId: reqCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'from_status', type: 'text' },
          { name: 'to_status', type: 'text' },
          { name: 'changed_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(logsCol)
    }
  },
  (app) => {
    try {
      const logsCol = app.findCollectionByNameOrId('engineering_logs')
      app.delete(logsCol)
    } catch (_) {}

    try {
      const reqCol = app.findCollectionByNameOrId('engineering_requests')
      reqCol.fields.removeByName('boleto_sent_at')
      reqCol.fields.removeByName('finalized_at')
      app.save(reqCol)
    } catch (_) {}
  },
)
