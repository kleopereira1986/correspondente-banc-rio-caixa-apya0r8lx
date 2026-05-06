migrate(
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    processes.fields.add(
      new RelationField({
        name: 'rejection_reason_type',
        collectionId: app.findCollectionByNameOrId('rejection_reasons').id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    app.save(processes)
  },
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    processes.fields.removeByName('rejection_reason_type')
    app.save(processes)
  },
)
