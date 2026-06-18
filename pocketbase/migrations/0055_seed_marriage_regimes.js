migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('marriage_regimes')
    const regimes = [
      'Comunhão Parcial de Bens',
      'Comunhão Universal de Bens',
      'Separação Total de Bens',
      'Participação Final nos Aqüestos',
    ]
    for (const name of regimes) {
      try {
        app.findFirstRecordByData('marriage_regimes', 'name', name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', name)
        app.save(record)
      }
    }
  },
  (app) => {
    const regimes = [
      'Comunhão Parcial de Bens',
      'Comunhão Universal de Bens',
      'Separação Total de Bens',
      'Participação Final nos Aqüestos',
    ]
    for (const name of regimes) {
      try {
        const record = app.findFirstRecordByData('marriage_regimes', 'name', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)
