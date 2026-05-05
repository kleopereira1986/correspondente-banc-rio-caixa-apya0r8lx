migrate(
  (app) => {
    const docs = [
      'CNH/RG',
      'Comprovante de Endereço',
      'Certidão estado civil',
      'Holerite 01',
      'Holerite 02',
      'Holerite 03',
      'Carteira de trabalho',
      'IRPF',
    ]
    const cats = ['1º Proponente', '2º Proponente / Conjuge']
    const col = app.findCollectionByNameOrId('credit_document_types')

    for (const cat of cats) {
      for (const doc of docs) {
        try {
          app.findFirstRecordByFilter('credit_document_types', `name='${doc}' && category='${cat}'`)
        } catch (_) {
          const rec = new Record(col)
          rec.set('name', doc)
          rec.set('category', cat)
          app.save(rec)
        }
      }
    }
  },
  (app) => {},
)
