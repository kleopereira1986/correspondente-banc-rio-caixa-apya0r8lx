migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('engineering_requests')
    col.addIndex('idx_eng_req_requester', false, 'requester_name', '')
    col.addIndex('idx_eng_req_reg_num', false, 'registration_number', '')
    col.addIndex('idx_eng_req_engineer', false, 'engineer_name', '')
    col.addIndex('idx_eng_req_created', false, 'created', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('engineering_requests')
    col.removeIndex('idx_eng_req_requester')
    col.removeIndex('idx_eng_req_reg_num')
    col.removeIndex('idx_eng_req_engineer')
    col.removeIndex('idx_eng_req_created')
    app.save(col)
  },
)
