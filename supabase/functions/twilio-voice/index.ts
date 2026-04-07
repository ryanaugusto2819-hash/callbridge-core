const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Chamada recebida no número Twilio → conecta direto ao agente no browser
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Client>agent</Client>
  </Dial>
</Response>`

  return new Response(twiml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml',
    },
    status: 200,
  })
})
