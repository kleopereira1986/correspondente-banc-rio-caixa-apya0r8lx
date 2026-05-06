migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.addIndex('idx_processes_analysis_type', false, 'analysis_type', '')
    col.addIndex('idx_processes_conformity', false, 'is_conformity_approved', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('processes')
    col.removeIndex('idx_processes_analysis_type')
    col.removeIndex('idx_processes_conformity')
    app.save(col)
  },
)
