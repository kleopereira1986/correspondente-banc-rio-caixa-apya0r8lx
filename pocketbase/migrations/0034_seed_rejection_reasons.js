migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('rejection_reasons')

    const reasons = ['RATING', 'COMPROMETIMENTO DE RENDA']
    for (const reason of reasons) {
      try {
        app.findFirstRecordByData('rejection_reasons', 'name', reason)
      } catch (_) {
        const record = new Record(collection)
        record.set('name', reason)
        app.save(record)
      }
    }
  },
  (app) => {
    // Revert seeding not strictly necessary
  },
)
