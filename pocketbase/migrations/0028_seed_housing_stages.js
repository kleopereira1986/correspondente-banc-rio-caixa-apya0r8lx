migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('housing_stages')
    const stages = [
      { name: 'Montagem de Pasta', order: 1 },
      { name: 'Análise de Documentos', order: 2 },
      { name: 'Emissão de Boleto', order: 3 },
      { name: 'Aguardando Avaliação', order: 4 },
      { name: 'Finalizado', order: 5 },
    ]
    for (const s of stages) {
      try {
        app.findFirstRecordByData('housing_stages', 'name', s.name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', s.name)
        record.set('order', s.order)
        app.save(record)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('housing_stages')
    app.truncateCollection(col)
  },
)
