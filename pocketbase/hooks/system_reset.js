routerAdd(
  'POST',
  '/backend/v1/system/reset',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'master') {
      throw new ForbiddenError('Apenas administradores podem resetar o sistema.')
    }

    const collectionsToClear = [
      'processes',
      'documents',
      'tasks',
      'task_interactions',
      'engineering_requests',
      'engineering_logs',
      'process_logs',
    ]

    $app.runInTransaction((txApp) => {
      for (const colName of collectionsToClear) {
        try {
          const col = txApp.findCollectionByNameOrId(colName)
          txApp.truncateCollection(col)
        } catch (err) {
          $app.logger().error('Erro ao resetar coleção', 'collection', colName, 'erro', err.message)
        }
      }
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
