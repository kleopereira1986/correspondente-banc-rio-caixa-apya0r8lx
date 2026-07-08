migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('housing_stages')
    try {
      app.findFirstRecordByData('housing_stages', 'name', 'Triagem CCA')
    } catch (_) {
      const record = new Record(col)
      record.set('name', 'Triagem CCA')
      record.set('order', 1)
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('housing_stages', 'name', 'Triagem CCA')
      app.delete(record)
    } catch (_) {}
  },
)
