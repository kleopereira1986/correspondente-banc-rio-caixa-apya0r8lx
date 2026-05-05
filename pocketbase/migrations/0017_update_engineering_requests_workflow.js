migrate((app) => {
  const col = app.findCollectionByNameOrId('engineering_requests')

  col.fields.add(
    new SelectField({
      name: 'status',
      values: [
        'pending_analysis',
        'in_progress',
        'boleto_issued',
        'engineer_requested',
        'completed',
      ],
    }),
  )
  col.fields.add(
    new FileField({
      name: 'boleto_file',
      maxSelect: 1,
      maxSize: 5242880,
    }),
  )
  col.fields.add(new BoolField({ name: 'is_paid' }))
  col.fields.add(new DateField({ name: 'payment_date' }))
  col.fields.add(new TextField({ name: 'engineer_name' }))
  col.fields.add(new TextField({ name: 'engineer_phone' }))

  col.viewRule = ''
  col.updateRule = ''

  app.save(col)
})
