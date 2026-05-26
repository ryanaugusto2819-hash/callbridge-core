// TwiML App Voice URL — chamadas saindo do browser via Twilio Client SDK
// Configurar no Console Twilio > TwiML Apps > Voice URL

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || ''
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''

  // Twilio envia os parâmetros como form-encoded
  const body = await req.formData().catch(() => new FormData())
  const rawTo = (body.get('To') as string) || ''
  // Normaliza para E.164 — Twilio exige '+' para discagem internacional
  const to = rawTo
    ? (rawTo.startsWith('+') ? rawTo : `+${rawTo.replace(/\D/g, '')}`)
    : ''

  console.log('twilio-app-voice incoming:', { rawTo, to, from: TWILIO_PHONE_NUMBER })

  let twiml: string

  if (to && to !== TWILIO_PHONE_NUMBER) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${TWILIO_PHONE_NUMBER}" record="record-from-answer-dual" recordingStatusCallback="${SUPABASE_URL}/functions/v1/twilio-recording-status" recordingStatusCallbackEvent="completed">
    <Number>${to}</Number>
  </Dial>
</Response>`
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Número de destino inválido.</Say>
</Response>`
  }

  return new Response(twiml, {
    headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    status: 200,
  })
})
