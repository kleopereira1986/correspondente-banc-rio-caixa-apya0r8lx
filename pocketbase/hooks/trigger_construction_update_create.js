onRecordAfterCreateSuccess((e) => {
  const companyId = e.record.getString('construction_company')
  if (!companyId) return e.next()

  try {
    const updatesCol = $app.findCollectionByNameOrId('public_construction_updates')
    const record = new Record(updatesCol)
    record.set('construction_company', companyId)
    record.set('process_id', e.record.id)
    $app.save(record)
  } catch (err) {
    console.log('Failed to create public_construction_update on create', err.message)
  }

  return e.next()
}, 'processes')
