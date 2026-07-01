routerAdd(
  'POST',
  '/backend/v1/users/{id}/change-password',
  (e) => {
    const auth = e.requestInfo().auth
    if (!auth) return e.unauthorizedError('auth required')

    if (auth.getString('role') !== 'master') {
      return e.forbiddenError('Apenas usuários master podem alterar senhas.')
    }

    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}
    const newPassword = body.password || ''

    if (newPassword.length < 8) {
      return e.badRequestError('A senha deve ter no mínimo 8 caracteres.', {
        password: new ValidationError(
          'validation_min_text_constraint',
          'A senha deve ter no mínimo 8 caracteres.',
        ),
      })
    }

    try {
      const record = $app.findRecordById('users', id)
      record.setPassword(newPassword)
      $app.save(record)
      return e.json(200, { success: true })
    } catch (err) {
      return e.internalServerError('Erro ao alterar a senha.')
    }
  },
  $apis.requireAuth(),
)
