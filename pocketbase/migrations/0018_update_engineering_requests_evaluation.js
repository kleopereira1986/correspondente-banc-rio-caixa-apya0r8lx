migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('engineering_requests')

    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'pending_analysis',
        'in_progress',
        'boleto_issued',
        'engineer_requested',
        'in_evaluation',
        'completed',
      ]
    }

    if (!col.fields.getByName('evaluation_value')) {
      col.fields.add(new NumberField({ name: 'evaluation_value' }))
    }

    if (!col.fields.getByName('report_status')) {
      col.fields.add(
        new SelectField({
          name: 'report_status',
          values: ['valid', 'invalid'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('non_conformity_notes')) {
      col.fields.add(new TextField({ name: 'non_conformity_notes' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('engineering_requests')

    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'pending_analysis',
        'in_progress',
        'boleto_issued',
        'engineer_requested',
        'completed',
      ]
    }

    col.fields.removeByName('evaluation_value')
    col.fields.removeByName('report_status')
    col.fields.removeByName('non_conformity_notes')

    app.save(col)
  },
)
