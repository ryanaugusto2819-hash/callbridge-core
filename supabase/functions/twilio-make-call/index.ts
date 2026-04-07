import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Campo "phone" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ error: 'Credenciais do Twilio não configuradas. Adicione TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER nos secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // URL da edge function twilio-voice para o TwiML
    const voiceUrl = `${SUPABASE_URL}/functions/v1/twilio-voice`

    // Fazer chamada via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        From: TWILIO_PHONE_NUMBER,
        Url: voiceUrl,
        Record: 'true',
        RecordingChannels: 'dual',
        RecordingStatusCallback: `${SUPABASE_URL}/functions/v1/twilio-recording-status`,
        RecordingStatusCallbackEvent: 'completed',
        StatusCallback: `${SUPABASE_URL}/functions/v1/twilio-call-status`,
        StatusCallbackEvent: 'initiated ringing answered completed',
      }),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio API error:', twilioData)
      return new Response(
        JSON.stringify({ 
          error: `Erro do Twilio: ${twilioData.message || twilioData.more_info || 'Erro desconhecido'}`,
          code: twilioData.code,
          status: twilioData.status 
        }),
        { status: twilioResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Salvar no banco de dados
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      
      await supabase.from('call_logs').insert({
        phone_number: phone,
        direction: 'outbound',
        status: twilioData.status || 'initiated',
        twilio_call_sid: twilioData.sid,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Chamada iniciada com sucesso',
        call_sid: twilioData.sid,
        status: twilioData.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error making call:', error)
    return new Response(
      JSON.stringify({ error: `Erro interno: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
