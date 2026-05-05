migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.add(new NumberField({ name: 'approved_financing_value' }))
    col.fields.add(new NumberField({ name: 'approved_installment_value' }))
    col.fields.add(new DateField({ name: 'evaluation_expiry_date' }))
    col.fields.add(new TextField({ name: 'additional_details' }))
    col.fields.add(new TextField({ name: 'conditioning_reason' }))
    col.fields.add(new NumberField({ name: 'conditioned_installment_value' }))
    col.fields.add(new TextField({ name: 'rejection_reason' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.fields.removeByName('approved_financing_value')
    col.fields.removeByName('approved_installment_value')
    col.fields.removeByName('evaluation_expiry_date')
    col.fields.removeByName('additional_details')
    col.fields.removeByName('conditioning_reason')
    col.fields.removeByName('conditioned_installment_value')
    col.fields.removeByName('rejection_reason')
    app.save(col)
  },
)
