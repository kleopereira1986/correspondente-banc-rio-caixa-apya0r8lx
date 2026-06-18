migrate(
  (app) => {
    const docs = [
      'Carteira de identidade, CPF ou CNH',
      'Prova de estado civil - certidão de nascimento para solteiros ou certidão de casamento para casados, divorciados ou separados',
      'Comprovante de rendimentos',
      'Último comprovante de residência (água, luz, telefone, condomínio, aluguel, fatura cartão, etc)',
      'Declaração de imposto de renda com o recibo de entrega (se declarou)',
      'Carteira de trabalho - baixar a versão digital do documento e enviar arquivo em PDF completo',
      'Registro do pacto (caso seja casado em comunhão/separação de bens e possua pacto antenupcial)',
      'Escritura do pacto (caso seja casado em comunhão/separação de bens e possua pacto antenupcial)',
    ]

    const col = app.findCollectionByNameOrId('credit_document_types')
    for (const doc of docs) {
      try {
        app.findFirstRecordByData('credit_document_types', 'name', doc)
      } catch (_) {
        const rec = new Record(col)
        rec.set('name', doc)
        rec.set('category', '1º Proponente')
        rec.set('is_active', true)
        app.save(rec)
      }
    }
  },
  (app) => {},
)
