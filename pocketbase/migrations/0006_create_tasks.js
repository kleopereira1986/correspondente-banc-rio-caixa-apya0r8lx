migrate(
  (app) => {
    // 1. Update users role
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      roleField.values = ['master', 'analyst', 'buyer', 'seller', 'broker']
      app.save(usersCol)
    }

    // 2. task_types
    const taskTypes = new Collection({
      name: 'task_types',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'master'",
      updateRule: "@request.auth.role = 'master'",
      deleteRule: "@request.auth.role = 'master'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(taskTypes)

    // 3. tasks
    const tasks = new Collection({
      name: 'tasks',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || requester = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || requester = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'broker')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst' || requester = @request.auth.id)",
      deleteRule: "@request.auth.role = 'master'",
      fields: [
        {
          name: 'type',
          type: 'relation',
          required: true,
          collectionId: taskTypes.id,
          maxSelect: 1,
        },
        {
          name: 'requester',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'assigned_analyst',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'in_progress', 'completed', 'returned'],
        },
        { name: 'request_date', type: 'date' },
        { name: 'return_date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(tasks)

    // 4. task_interactions
    const taskInteractions = new Collection({
      name: 'task_interactions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.role = 'master'",
      fields: [
        { name: 'task', type: 'relation', required: true, collectionId: tasks.id, maxSelect: 1 },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'message', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(taskInteractions)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('task_interactions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('tasks'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('task_types'))
    } catch (_) {}

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      roleField.values = ['master', 'analyst', 'buyer', 'seller']
      app.save(usersCol)
    }
  },
)
