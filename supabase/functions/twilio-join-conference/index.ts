// Retorna TwiML que faz o cliente discado entrar na conference
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  let name = url.searchParams.get('name') || ''
  if (!name) {
    const body = await req.formData().catch(() => new FormData())
    name = (body.get('name') as string) || ''
  }

  console.log('twilio-join-conference name=', name)

  if (!name) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR">Conferência inválida.</Say></Response>`
    return new Response(twiml, { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 200 })
  }

  const safe = name.replace(/[<>&"']/g, '')
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="true" waitUrl="">${safe}</Conference>
  </Dial>
</Response>`
  return new Response(twiml, { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 200 })
})