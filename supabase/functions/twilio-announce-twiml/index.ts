// Retorna TwiML <Play> usado pelo AnnounceUrl da Conference
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const audio = url.searchParams.get('audio') || ''
  console.log('twilio-announce-twiml audio=', audio)

  if (!audio) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 200,
    })
  }
  const safe = audio.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${safe}</Play></Response>`
  return new Response(twiml, { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 200 })
})