migrate(
  (app) => {
    app
      .db()
      .newQuery(
        'UPDATE users SET is_approved = true WHERE is_approved = false OR is_approved IS NULL',
      )
      .execute()
  },
  (app) => {
    // Irreversible, backward compatibility data fix
  },
)
