migrate(
  (app) => {
    const creditTypes = [
      'MCMV IMOVEL NOVO INDIVIDUAL',
      'MCMV IMOVEL USADO',
      'MCMV IMOVEL NOVO DE EMPREENDIMENTO',
      'SBPE IMOVEL NOVO',
      'SBPE IMOVEL USADO',
      'PRO COTISTA',
    ]
    const col = app.findCollectionByNameOrId('credit_analysis_types')
    for (const name of creditTypes) {
      try {
        app.findFirstRecordByData('credit_analysis_types', 'name', name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', name)
        app.save(record)
      }
    }

    const devCol = app.findCollectionByNameOrId('development_types')
    try {
      app.findFirstRecordByData('development_types', 'name', 'Residencial Parque das Flores')
    } catch (_) {
      const record = new Record(devCol)
      record.set('name', 'Residencial Parque das Flores')
      app.save(record)
    }
  },
  (app) => {
    // Can't reliably rollback seeds without potentially dropping live data
  },
)
