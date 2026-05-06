migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.add(
      new SelectField({
        name: 'analysis_type',
        values: ['first_analysis', 'reevaluation'],
      }),
    )
    col.fields.add(
      new BoolField({
        name: 'is_conformity_approved',
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.removeByName('analysis_type')
    col.fields.removeByName('is_conformity_approved')
    app.save(col)
  },
)
