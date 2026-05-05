migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('engineering_requests')

    if (!col.fields.getByName('origin')) {
      col.fields.add(
        new SelectField({
          name: 'origin',
          values: ['internal', 'external'],
          maxSelect: 1,
        }),
      )
    }

    col.createRule = ''

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('engineering_requests')

    const field = col.fields.getByName('origin')
    if (field) {
      col.fields.removeById(field.id)
    }

    col.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')"

    app.save(col)
  },
)
