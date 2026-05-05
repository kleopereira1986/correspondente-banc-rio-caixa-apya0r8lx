migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('engineering_requests')

    if (!col.fields.getByName('requester_type')) {
      col.fields.add(
        new SelectField({
          name: 'requester_type',
          maxSelect: 1,
          values: ['Parceiro Corretor', 'Construtora', 'Comprador', 'Vendedor PF'],
        }),
      )
    }

    if (!col.fields.getByName('requester_phone')) {
      col.fields.add(
        new TextField({
          name: 'requester_phone',
        }),
      )
    }

    if (!col.fields.getByName('billing_cpf_cnpj')) {
      col.fields.add(
        new TextField({
          name: 'billing_cpf_cnpj',
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('engineering_requests')

    col.fields.removeByName('requester_type')
    col.fields.removeByName('requester_phone')
    col.fields.removeByName('billing_cpf_cnpj')

    app.save(col)
  },
)
