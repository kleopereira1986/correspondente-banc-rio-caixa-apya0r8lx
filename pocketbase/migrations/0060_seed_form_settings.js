migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('form_settings')
    const fields = [
      { name: 'Valor de compra do imóvel', key: 'property.purchase_value' },
      { name: 'Opção de compra é um imóvel', key: 'property.type_option' },
      { name: 'Financiar custas/despesas', key: 'property.finance_costs' },
      { name: 'Prazo desejado', key: 'property.desired_term' },
      { name: 'Tipo de amortização', key: 'property.amortization_system' },
      { name: 'Observações do imóvel', key: 'property.observations' },
      { name: 'PIS/NIS', key: 'buyer.pis' },
      { name: 'Data de nascimento', key: 'buyer.birth_date' },
      { name: 'Escolaridade', key: 'buyer.education' },
      { name: 'Estado civil', key: 'buyer.marital_status' },
      { name: 'Regime de Casamento', key: 'buyer.marriage_regime' },
      { name: 'Recolhimento de FGTS (3 anos)', key: 'buyer.fgts_3_years' },
      { name: 'Tem dependentes?', key: 'buyer.has_dependents' },
      { name: 'Declarou imposto de renda?', key: 'buyer.declared_tax' },
      { name: 'Possui imóvel próprio?', key: 'buyer.owns_property' },
    ]

    for (const f of fields) {
      try {
        app.findFirstRecordByData('form_settings', 'key', f.key)
      } catch (_) {
        const rec = new Record(col)
        rec.set('name', f.name)
        rec.set('key', f.key)
        rec.set('is_active', true)
        app.save(rec)
      }
    }
  },
  (app) => {},
)
