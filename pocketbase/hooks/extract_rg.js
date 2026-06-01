routerAdd(
  'POST',
  '/backend/v1/documentos/extrair-rg',
  (e) => {
    const body = e.requestInfo().body || {}
    const { fileBase64, mimeType } = body

    if (!fileBase64) {
      throw new BadRequestError('File base64 is required')
    }

    const url = $secrets.get('SKIP_AI_GATEWAY_URL')
    const key = $secrets.get('SKIP_AI_GATEWAY_API_KEY')

    if (!url || !key) {
      $app.logger().error('AI Gateway credentials not configured')
      throw new InternalServerError('Serviço de IA indisponível no momento.')
    }

    const prompt = `Extraia as seguintes informações deste documento de identidade (RG) brasileiro:
- nome_completo
- cpf
- data_nascimento
- data_expedicao

Retorne APENAS um objeto JSON válido com essas chaves exatas. Não inclua blocos de código markdown (\`\`\`json), apenas o JSON puro. Se não encontrar uma informação, deixe como string vazia. Formate o CPF apenas com números.`

    const res = $http.send({
      url: url + '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${fileBase64}` } },
            ],
          },
        ],
        temperature: 0.1,
      }),
      timeout: 60,
    })

    if (res.statusCode !== 200) {
      $app
        .logger()
        .error('AI extraction failed', 'status', res.statusCode, 'body', res.json || res.body)
      throw new BadRequestError('Falha ao analisar o documento. Verifique se a imagem está nítida.')
    }

    let extractedText = res.json?.choices?.[0]?.message?.content || '{}'
    // Clean markdown blocks if the model ignored the instruction
    extractedText = extractedText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    let data = {}
    try {
      data = JSON.parse(extractedText)
    } catch (err) {
      $app.logger().error('Failed to parse AI response', 'text', extractedText)
      throw new BadRequestError(
        'Falha ao extrair os dados. Formato de resposta inválido retornado pela IA.',
      )
    }

    return e.json(200, data)
  },
  $apis.requireAuth(),
)
