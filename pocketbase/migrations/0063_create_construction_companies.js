migrate(
  (app) => {
    const collection = new Collection({
      name: 'construction_companies',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')",
      deleteRule: "@request.auth.role = 'master'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'cnpj', type: 'text', required: true },
        { name: 'legal_representative', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'bank_name', type: 'text' },
        { name: 'bank_agency', type: 'text' },
        { name: 'bank_account', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('construction_companies')
    app.delete(collection)
  },
)
