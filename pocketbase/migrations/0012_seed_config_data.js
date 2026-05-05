migrate(
  (app) => {
    const creditTypes = app.findCollectionByNameOrId('credit_analysis_types')
    const propertyTypes = app.findCollectionByNameOrId('property_types')

    const ctNames = [
      'Aquisição de Imóvel Novo',
      'Aquisição de Imóvel Usado',
      'Construção em Terreno Próprio',
    ]
    for (const name of ctNames) {
      try {
        app.findFirstRecordByData('credit_analysis_types', 'name', name)
      } catch (_) {
        const record = new Record(creditTypes)
        record.set('name', name)
        app.save(record)
      }
    }

    const ptNames = ['Casa', 'Apartamento', 'Terreno', 'Comercial']
    for (const name of ptNames) {
      try {
        app.findFirstRecordByData('property_types', 'name', name)
      } catch (_) {
        const record = new Record(propertyTypes)
        record.set('name', name)
        app.save(record)
      }
    }
  },
  (app) => {
    const ctNames = [
      'Aquisição de Imóvel Novo',
      'Aquisição de Imóvel Usado',
      'Construção em Terreno Próprio',
    ]
    for (const name of ctNames) {
      try {
        const r = app.findFirstRecordByData('credit_analysis_types', 'name', name)
        app.delete(r)
      } catch (_) {}
    }
    const ptNames = ['Casa', 'Apartamento', 'Terreno', 'Comercial']
    for (const name of ptNames) {
      try {
        const r = app.findFirstRecordByData('property_types', 'name', name)
        app.delete(r)
      } catch (_) {}
    }
  },
)
