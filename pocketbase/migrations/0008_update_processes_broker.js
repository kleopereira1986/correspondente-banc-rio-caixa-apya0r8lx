migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('processes')

    collection.fields.add(
      new RelationField({
        name: 'broker',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )

    collection.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id || broker = @request.auth.id)"
    collection.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id || broker = @request.auth.id)"

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('processes')

    try {
      collection.fields.removeByName('broker')
    } catch (_) {}

    collection.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || buyer = @request.auth.id || seller = @request.auth.id)"
    collection.viewRule = ''

    app.save(collection)
  },
)
