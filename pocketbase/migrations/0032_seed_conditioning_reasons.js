migrate(
  (app) => {
    const reasons = [
      'RESTRIÇÃO EXTERNA',
      'BACEN/PREJUIZO',
      'BACEN/DIVIDASVENCIDAS',
      'COMPROMETIMENTO DE RENDA',
      'DIVIDA INTERNA NA CAIXA (PROCURE AGENCIA)',
    ]

    const col = app.findCollectionByNameOrId('conditioning_reasons')

    for (const name of reasons) {
      try {
        app.findFirstRecordByData('conditioning_reasons', 'name', name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', name)
        app.save(record)
      }
    }
  },
  (app) => {
    const reasons = [
      'RESTRIÇÃO EXTERNA',
      'BACEN/PREJUIZO',
      'BACEN/DIVIDASVENCIDAS',
      'COMPROMETIMENTO DE RENDA',
      'DIVIDA INTERNA NA CAIXA (PROCURE AGENCIA)',
    ]
    for (const name of reasons) {
      try {
        const record = app.findFirstRecordByData('conditioning_reasons', 'name', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)
