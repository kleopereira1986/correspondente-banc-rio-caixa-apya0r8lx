migrate(
  (app) => {
    const processes = app.findRecordsByFilter(
      'processes',
      "status = 'Aguardar Conformidade' || current_step = 'Aguardar Conformidade' || status = 'Aguardando Conformidade' || current_step = 'Aguardando Conformidade' || status = 'Awaiting Registration' || current_step = 'Registration' || status = 'Nova Solicitação' || current_step = 'Análise Inicial'",
    )
    for (const p of processes) {
      let changed = false
      const type = p.getString('type')

      const status = p.getString('status')
      if (
        ['Aguardar Conformidade', 'Aguardando Conformidade', 'Awaiting Registration'].includes(
          status,
        ) ||
        (type === 'credit' && status === 'Nova Solicitação')
      ) {
        p.set('status', 'Triagem')
        changed = true
      }

      const step = p.getString('current_step')
      if (
        [
          'Aguardar Conformidade',
          'Aguardando Conformidade',
          'Registration',
          'Análise Inicial',
        ].includes(step)
      ) {
        p.set('current_step', 'Triagem')
        changed = true
      }

      if (changed) {
        app.save(p)
      }
    }

    // Update logs as well
    const logs = app.findRecordsByFilter(
      'process_logs',
      "from_status = 'Aguardar Conformidade' || to_status = 'Aguardar Conformidade' || from_step = 'Aguardar Conformidade' || to_step = 'Aguardar Conformidade' || from_status = 'Aguardando Conformidade' || to_status = 'Aguardando Conformidade' || from_step = 'Aguardando Conformidade' || to_step = 'Aguardando Conformidade' || from_status = 'Awaiting Registration' || to_status = 'Awaiting Registration' || from_status = 'Nova Solicitação' || to_status = 'Nova Solicitação' || from_step = 'Análise Inicial' || to_step = 'Análise Inicial' || from_step = 'Registration' || to_step = 'Registration'",
    )
    for (const l of logs) {
      let changed = false
      if (
        [
          'Aguardar Conformidade',
          'Aguardando Conformidade',
          'Awaiting Registration',
          'Nova Solicitação',
        ].includes(l.getString('from_status'))
      ) {
        l.set('from_status', 'Triagem')
        changed = true
      }
      if (
        [
          'Aguardar Conformidade',
          'Aguardando Conformidade',
          'Awaiting Registration',
          'Nova Solicitação',
        ].includes(l.getString('to_status'))
      ) {
        l.set('to_status', 'Triagem')
        changed = true
      }
      if (
        [
          'Aguardar Conformidade',
          'Aguardando Conformidade',
          'Registration',
          'Análise Inicial',
        ].includes(l.getString('from_step'))
      ) {
        l.set('from_step', 'Triagem')
        changed = true
      }
      if (
        [
          'Aguardar Conformidade',
          'Aguardando Conformidade',
          'Registration',
          'Análise Inicial',
        ].includes(l.getString('to_step'))
      ) {
        l.set('to_step', 'Triagem')
        changed = true
      }
      if (changed) {
        app.save(l)
      }
    }
  },
  (app) => {
    const processes = app.findRecordsByFilter(
      'processes',
      "status = 'Triagem' || current_step = 'Triagem'",
    )
    for (const p of processes) {
      let changed = false
      if (p.getString('status') === 'Triagem') {
        p.set('status', 'Aguardar Conformidade')
        changed = true
      }
      if (p.getString('current_step') === 'Triagem') {
        p.set('current_step', 'Aguardar Conformidade')
        changed = true
      }
      if (changed) {
        app.save(p)
      }
    }
  },
)
