migrate(
  (app) => {
    const replaceRule = (col, ruleName) => {
      let rule = col[ruleName]
      if (!rule) return

      rule = rule.trim()

      if (rule === "@request.auth.role = 'master'" || rule === '@request.auth.role = "master"') {
        col[ruleName] = "@request.auth.id != '' && @request.auth.role = 'master'"
      } else if (
        rule === "@request.auth.role = 'master' || @request.auth.role = 'analyst'" ||
        rule === '@request.auth.role = "master" || @request.auth.role = "analyst"'
      ) {
        col[ruleName] =
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'analyst')"
      } else if (rule === "@request.auth.role = 'master' || @request.auth.role = 'broker'") {
        col[ruleName] =
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'broker')"
      } else if (rule === "@request.auth.role = 'master' || uploaded_by = @request.auth.id") {
        col[ruleName] =
          "@request.auth.id != '' && (@request.auth.role = 'master' || uploaded_by = @request.auth.id)"
      }
    }

    const collections = app.findAllCollections()
    collections.forEach((col) => {
      let changed = false
      ;['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule'].forEach((ruleName) => {
        const original = col[ruleName]
        replaceRule(col, ruleName)
        if (original !== col[ruleName]) changed = true
      })

      if (changed) {
        app.save(col)
      }
    })
  },
  (app) => {
    // Forward-only fix migration for security rules
  },
)
