// TwiML App Voice URL — disca o cliente diretamente a partir do navegador
// do agente. O áudio dos clipes é mixado no navegador via Web Audio API
// (ver src/lib/callAudioMixer.ts), então o cliente escuta tudo pela voz
// do agente. Grava a chamada inteira em modo dual-channel.

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

  const body = await req.formData().catch(() => new FormData())
  const rawTo = (body.get('To') as string) || ''
  const to = rawTo
    ? (rawTo.startsWith('+') ? rawTo : `+${rawTo.replace(/\D/g, '')}`)
    : ''

  console.log('twilio-app-voice:', { rawTo, to })

  if (!to || to === TWILIO_PHONE_NUMBER) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say language="pt-BR">Número de destino inválido.</Say></Response>`
    return new Response(twiml, { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 200 })
  }

  const recordingCb = `${SUPABASE_URL}/functions/v1/twilio-recording-status`
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${TWILIO_PHONE_NUMBER}" record="record-from-answer-dual" recordingStatusCallback="${recordingCb}" recordingStatusCallbackEvent="completed">
    <Number>${to}</Number>
  </Dial>
</Response>`

  return new Response(twiml, { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 200 })
})
