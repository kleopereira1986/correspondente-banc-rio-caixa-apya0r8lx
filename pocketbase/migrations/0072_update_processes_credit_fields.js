migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')

    col.fields.add(new BoolField({ name: 'has_defined_property' }))
    col.fields.add(new BoolField({ name: 'finance_costs' }))
    col.fields.add(new NumberField({ name: 'desired_term' }))
    col.fields.add(new TextField({ name: 'property_observations' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')

    col.fields.removeByName('has_defined_property')
    col.fields.removeByName('finance_costs')
    col.fields.removeByName('desired_term')
    col.fields.removeByName('property_observations')

    app.save(col)
  },
)
