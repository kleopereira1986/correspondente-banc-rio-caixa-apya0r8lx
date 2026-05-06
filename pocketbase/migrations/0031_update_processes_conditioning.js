migrate(
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    if (!processes.fields.getByName('conditioning_reason_type')) {
      processes.fields.add(
        new RelationField({
          name: 'conditioning_reason_type',
          collectionId: app.findCollectionByNameOrId('conditioning_reasons').id,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(processes)
    }
  },
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    processes.fields.removeByName('conditioning_reason_type')
    app.save(processes)
  },
)
