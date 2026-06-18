migrate(
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    const cc = app.findCollectionByNameOrId('construction_companies')
    processes.fields.add(
      new RelationField({
        name: 'construction_company',
        collectionId: cc.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(processes)
  },
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    processes.fields.removeByName('construction_company')
    app.save(processes)
  },
)
