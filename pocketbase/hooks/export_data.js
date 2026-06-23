// @deps jspdf@2.5.2, jspdf-autotable@3.8.4, xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/export/pdf',
  (e) => {
    const { jsPDF } = require('jspdf')
    require('jspdf-autotable')
    const body = e.requestInfo().body

    const doc = new jsPDF('landscape')
    doc.text(body.title || 'Relatório', 14, 15)
    doc.autoTable({
      head: [body.headers || []],
      body: body.rows || [],
      startY: 20,
      styles: { fontSize: 8 },
    })

    const pdfBytes = doc.output('arraybuffer')
    return e.blob(200, 'application/pdf', pdfBytes)
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/export/excel',
  (e) => {
    const xlsx = require('xlsx')
    const body = e.requestInfo().body

    const ws = xlsx.utils.aoa_to_sheet([body.headers || [], ...(body.rows || [])])
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Planilha1')

    const excelBytes = xlsx.write(wb, { type: 'array', bookType: 'xlsx' })
    return e.blob(
      200,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      excelBytes,
    )
  },
  $apis.requireAuth(),
)
