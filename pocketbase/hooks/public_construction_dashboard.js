routerAdd('GET', '/backend/v1/public/construction-companies/{id}/dashboard', (e) => {
  const id = e.request.pathValue('id')

  try {
    const company = $app.findRecordById('construction_companies', id)

    const stages = $app.findRecordsByFilter('housing_stages', '1=1', 'order', 100, 0)
    const processes = $app.findRecordsByFilter(
      'processes',
      `construction_company = '${id}' && type = 'housing'`,
      '-created',
      1000,
      0,
    )

    const enrichedProcesses = processes.map((p) => {
      let buyerName = ''
      try {
        const buyerId = p.getString('buyer')
        if (buyerId) {
          const buyer = $app.findRecordById('users', buyerId)
          buyerName = buyer.getString('name')
        }
      } catch (_) {}

      return {
        id: p.id,
        current_step: p.getString('current_step'),
        status: p.getString('status'),
        buyerName,
        observations: p.getString('observations'),
        created: p.getString('created'),
      }
    })

    return e.json(200, {
      company: {
        id: company.id,
        name: company.getString('name'),
      },
      stages: stages.map((s) => ({
        id: s.id,
        name: s.getString('name'),
        order: s.getInt('order'),
      })),
      processes: enrichedProcesses,
    })
  } catch (err) {
    return e.notFoundError('Construtora não encontrada')
  }
})
