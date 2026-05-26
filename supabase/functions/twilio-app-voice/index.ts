// TwiML App Voice URL — coloca agente (browser) em uma Conference
// e disca o cliente para a mesma Conference, permitindo tocar áudios
// para AMBOS via API de Announce do Twilio.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || ''
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''

  const body = await req.formData().catch(() => new FormData())
  const rawTo = (body.get('To') as string) || ''
  const parentCallSid = (body.get('CallSid') as string) || ''
  const to = rawTo
    ? (rawTo.startsWith('+') ? rawTo : `+${rawTo.replace(/\D/g, '')}`)
    : ''

  // Nome da conferência = CallSid do agente (único e recuperável depois)
  const conferenceName = parentCallSid || `room-${Date.now()}`

  console.log('twilio-app-voice:', { rawTo, to, parentCallSid, conferenceName })

  if (!to || to === TWILIO_PHONE_NUMBER) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say language="pt-BR">Número de destino inválido.</Say></Response>`
    return new Response(twiml, { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 200 })
  }

  // Dispara (em background) chamada REST p/ o cliente entrar na mesma conferência
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const clientTwimlUrl = `${SUPABASE_URL}/functions/v1/twilio-join-conference?name=${encodeURIComponent(conferenceName)}`
    const statusCb = `${SUPABASE_URL}/functions/v1/twilio-call-status`
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Url: clientTwimlUrl,
        StatusCallback: statusCb,
        StatusCallbackEvent: 'initiated ringing answered completed',
      }),
    }).then(async (r) => {
      const t = await r.text()
      console.log('outbound dial result', r.status, t)
    }).catch((e) => console.error('outbound dial error', e))
  } else {
    console.error('Twilio credentials ausentes — não dá pra discar para o cliente')
  }

  // Agente (browser) entra na conference imediatamente
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="true" record="record-from-start" recordingStatusCallback="${SUPABASE_URL}/functions/v1/twilio-recording-status" recordingStatusCallbackEvent="completed" waitUrl="">${conferenceName}</Conference>
  </Dial>
</Response>`

  return new Response(twiml, { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 200 })
})
