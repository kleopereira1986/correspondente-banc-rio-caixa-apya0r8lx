migrate(
  (app) => {
    // 1. Standardize the TRIAGEM CCA stage name (exact uppercase)
    let triagemStage = null

    try {
      triagemStage = app.findFirstRecordByData('housing_stages', 'name', 'TRIAGEM CCA')
    } catch (_) {
      try {
        const matches = app.findRecordsByFilter(
          'housing_stages',
          'name ~ "triagem"',
          'order',
          10,
          0,
        )
        if (matches.length > 0) {
          triagemStage = matches[0]
        }
      } catch (_) {}
    }

    if (triagemStage) {
      if (triagemStage.getString('name') !== 'TRIAGEM CCA') {
        triagemStage.set('name', 'TRIAGEM CCA')
        app.save(triagemStage)
      }
    } else {
      const stagesCol = app.findCollectionByNameOrId('housing_stages')
      const record = new Record(stagesCol)
      record.set('name', 'TRIAGEM CCA')
      record.set('order', 1)
      app.save(record)
    }

    // 2. Fix orphaned housing processes — empty current_step or old "Triagem CCA" casing
    try {
      const orphans = app.findRecordsByFilter(
        'processes',
        'type = "housing" && (current_step = "" || current_step = "Triagem CCA")',
        '-created',
        1000,
        0,
      )
      for (const proc of orphans) {
        proc.set('current_step', 'TRIAGEM CCA')
        app.save(proc)
      }
    } catch (e) {
      console.log('Error fixing orphaned processes:', e)
    }

    // 2b. Fix any other case variant of "triagem" in current_step that isn't exact "TRIAGEM CCA"
    try {
      const variantProcs = app.findRecordsByFilter(
        'processes',
        'type = "housing" && current_step ~ "triagem" && current_step != "TRIAGEM CCA"',
        '-created',
        1000,
        0,
      )
      for (const proc of variantProcs) {
        proc.set('current_step', 'TRIAGEM CCA')
        app.save(proc)
      }
    } catch (e) {
      console.log('Error fixing variant procs:', e)
    }

    // 3. Specifically fix Leonel Aparecido Lemes's process
    try {
      const leonelUser = app.findFirstRecordByData('users', 'name', 'Leonel Aparecido Lemes')
      try {
        const leonelProcs = app.findRecordsByFilter(
          'processes',
          'buyer = "' + leonelUser.id + '"',
          '-created',
          50,
          0,
        )
        for (const proc of leonelProcs) {
          proc.set('type', 'housing')
          proc.set('current_step', 'TRIAGEM CCA')
          app.save(proc)
        }
      } catch (e) {
        console.log('No processes found for Leonel')
      }
    } catch (e) {
      console.log('Leonel user not found')
    }
  },
  (app) => {
    try {
      const stage = app.findFirstRecordByData('housing_stages', 'name', 'TRIAGEM CCA')
      stage.set('name', 'Triagem CCA')
      app.save(stage)
    } catch (_) {}
  },
)
