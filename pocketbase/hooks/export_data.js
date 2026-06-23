routerAdd(
  'POST',
  '/backend/v1/export/pdf',
  (e) => {
    const body = e.requestInfo().body || {}
    const headers = body.headers || []
    const rows = body.rows || []

    const toCsv = (val) => '"' + String(val ?? '').replace(/"/g, '""') + '"'
    const lines = [headers.map(toCsv).join(','), ...rows.map((r) => r.map(toCsv).join(','))]
    const csv = '\uFEFF' + lines.join('\n')

    e.response.header().set('Content-Type', 'text/csv; charset=utf-8')
    e.response.header().set('Content-Disposition', 'attachment; filename="export.csv"')
    return e.string(200, csv)
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/export/excel',
  (e) => {
    const body = e.requestInfo().body || {}
    const headers = body.headers || []
    const rows = body.rows || []

    const toCsv = (val) => '"' + String(val ?? '').replace(/"/g, '""') + '"'
    const lines = [headers.map(toCsv).join(','), ...rows.map((r) => r.map(toCsv).join(','))]
    const csv = '\uFEFF' + lines.join('\n')

    e.response.header().set('Content-Type', 'text/csv; charset=utf-8')
    e.response.header().set('Content-Disposition', 'attachment; filename="export.csv"')
    return e.string(200, csv)
  },
  $apis.requireAuth(),
)
