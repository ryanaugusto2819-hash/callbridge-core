import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 })
  }

  try {
    const formData = await req.text()
    const params = new URLSearchParams(formData)

    const callSid = params.get('CallSid')
    const callStatus = params.get('CallStatus')
    const callDuration = params.get('CallDuration')

    console.log('Call status callback:', { callSid, callStatus, callDuration })

    if (!callSid) {
      return new Response('Missing CallSid', { status: 400 })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (callStatus) updateData.status = callStatus
    if (callDuration) updateData.duration = parseInt(callDuration)

    await supabase
      .from('call_logs')
      .update(updateData)
      .eq('twilio_call_sid', callSid)

    return new Response('<Response/>', {
      headers: { 'Content-Type': 'text/xml' },
      status: 200,
    })
  } catch (error) {
    console.error('Call status error:', error)
    return new Response('Error', { status: 500 })
  }
})
