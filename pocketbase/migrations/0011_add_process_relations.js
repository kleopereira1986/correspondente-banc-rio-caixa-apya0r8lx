migrate(
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')

    const creditAnalysisTypesId = app.findCollectionByNameOrId('credit_analysis_types').id
    processes.fields.add(
      new RelationField({
        name: 'credit_analysis_type',
        collectionId: creditAnalysisTypesId,
        maxSelect: 1,
      }),
    )

    const propertyTypesId = app.findCollectionByNameOrId('property_types').id
    processes.fields.add(
      new RelationField({
        name: 'property_type',
        collectionId: propertyTypesId,
        maxSelect: 1,
      }),
    )

    app.save(processes)
  },
  (app) => {
    const processes = app.findCollectionByNameOrId('processes')
    processes.fields.removeByName('credit_analysis_type')
    processes.fields.removeByName('property_type')
    app.save(processes)
  },
)
