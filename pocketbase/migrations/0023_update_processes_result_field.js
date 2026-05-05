migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    const resultField = col.fields.getByName('result')
    if (resultField && !resultField.values.includes('conditioned')) {
      resultField.values.push('conditioned')
      app.save(col)
    }
  },
  (app) => {},
)
