import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR" voice="Polly.Camila">Olá, esta é uma ligação automática do nosso sistema. Por favor, aguarde enquanto conectamos você a um atendente.</Say>
  <Pause length="2"/>
  <Say language="pt-BR" voice="Polly.Camila">Obrigado por aguardar. Um momento, por favor.</Say>
</Response>`

  return new Response(twiml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml',
    },
    status: 200,
  })
})
