const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function signJwt(header: object, payload: object, secret: string): Promise<string> {
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const headerB64 = encode(header)
  const payloadB64 = encode(payload)
  const data = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${data}.${signatureB64}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY')
    const TWILIO_API_SECRET = Deno.env.get('TWILIO_API_SECRET')
    const TWILIO_TWIML_APP_SID = Deno.env.get('TWILIO_TWIML_APP_SID')

    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET || !TWILIO_TWIML_APP_SID) {
      return new Response(
        JSON.stringify({ error: 'Configure TWILIO_API_KEY, TWILIO_API_SECRET e TWILIO_TWIML_APP_SID nos secrets do Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json().catch(() => ({}))
    const identity = (body.identity as string) || 'agent'
    const now = Math.floor(Date.now() / 1000)

    const token = await signJwt(
      { alg: 'HS256', typ: 'JWT', cty: 'twilio-fpa;v=1' },
      {
        jti: `${TWILIO_API_KEY}-${now}`,
        iss: TWILIO_API_KEY,
        sub: TWILIO_ACCOUNT_SID,
        exp: now + 3600,
        grants: {
          identity,
          voice: {
            incoming: { allow: true },
            outgoing: { application_sid: TWILIO_TWIML_APP_SID },
          },
        },
      },
      TWILIO_API_SECRET
    )

    return new Response(
      JSON.stringify({ token, identity }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
