migrate(
  (app) => {
    const documents = app.findCollectionByNameOrId('documents')
    documents.deleteRule = "@request.auth.role = 'master' || @request.auth.role = 'analyst'"
    app.save(documents)
  },
  (app) => {
    try {
      const documents = app.findCollectionByNameOrId('documents')
      documents.deleteRule = "@request.auth.role = 'master' || uploaded_by = @request.auth.id"
      app.save(documents)
    } catch (_) {}
  },
)
