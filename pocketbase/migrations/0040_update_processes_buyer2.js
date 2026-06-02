migrate(
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')

    processes.fields.add(
      new RelationField({
        name: 'buyer_2',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )

    processes.fields.add(
      new NumberField({
        name: 'property_purchase_value',
      }),
    )

    processes.createRule = ''

    app.save(processes)
  },
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    processes.fields.removeByName('buyer_2')
    processes.fields.removeByName('property_purchase_value')
    processes.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id || broker = @request.auth.id)"
    app.save(processes)
  },
)
