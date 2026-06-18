onRecordAfterUpdateSuccess((e) => {
  const companyId = e.record.getString('construction_company')
  if (!companyId) return e.next()

  const stepChanged =
    e.record.getString('current_step') !== e.record.original().getString('current_step')
  const statusChanged = e.record.getString('status') !== e.record.original().getString('status')
  const obsChanged =
    e.record.getString('observations') !== e.record.original().getString('observations')
  const buyerChanged = e.record.getString('buyer') !== e.record.original().getString('buyer')

  if (!stepChanged && !statusChanged && !obsChanged && !buyerChanged) return e.next()

  try {
    const updatesCol = $app.findCollectionByNameOrId('public_construction_updates')
    const record = new Record(updatesCol)
    record.set('construction_company', companyId)
    record.set('process_id', e.record.id)
    $app.save(record)
  } catch (err) {
    console.log('Failed to create public_construction_update on update', err.message)
  }

  return e.next()
}, 'processes')
