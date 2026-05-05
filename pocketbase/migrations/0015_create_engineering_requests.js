migrate(
  (app) => {
    const collection = new Collection({
      name: 'engineering_requests',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'master'",
      fields: [
        { name: 'requester_name', type: 'text', required: true },
        { name: 'requester_cpf', type: 'text' },
        { name: 'requester_email', type: 'text', required: true },
        { name: 'seller_info', type: 'text' },
        { name: 'requested_value', type: 'number' },
        {
          name: 'evaluation_type',
          type: 'select',
          required: true,
          values: ['new', 'used'],
          maxSelect: 1,
        },
        { name: 'registration_number', type: 'text' },
        { name: 'block', type: 'text' },
        { name: 'area', type: 'text' },
        { name: 'billing_name', type: 'text' },
        { name: 'billing_email', type: 'text' },
        { name: 'billing_phone', type: 'text' },
        { name: 'contact_person_name', type: 'text' },
        { name: 'contact_person_phone', type: 'text' },
        { name: 'documents', type: 'file', maxSelect: 10, maxSize: 52428800 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('engineering_requests')
    app.delete(collection)
  },
)
