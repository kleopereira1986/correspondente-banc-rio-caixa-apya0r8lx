migrate(
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    const agencies = app.findCollectionByNameOrId('real_estate_agencies')
    if (!processes.fields.getByName('real_estate_agency')) {
      processes.fields.add(
        new RelationField({
          name: 'real_estate_agency',
          collectionId: agencies.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(processes)
  },
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    processes.fields.removeByName('real_estate_agency')
    app.save(processes)
  },
)
