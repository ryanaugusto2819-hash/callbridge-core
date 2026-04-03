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
    const formData = await req.text()
    const params = new URLSearchParams(formData)

    const callSid = params.get('CallSid')
    const recordingUrl = params.get('RecordingUrl')
    const recordingDuration = params.get('RecordingDuration')
    const recordingStatus = params.get('RecordingStatus')

    console.log('Recording status callback:', { callSid, recordingUrl, recordingStatus, recordingDuration })

    if (!callSid || !recordingUrl) {
      return new Response('Missing data', { status: 400 })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Twilio recording URL needs .mp3 appended for playback
    const recordingMp3Url = `${recordingUrl}.mp3`

    const { error } = await supabase
      .from('call_logs')
      .update({
        recording_url: recordingMp3Url,
        duration: recordingDuration ? parseInt(recordingDuration) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('twilio_call_sid', callSid)

    if (error) {
      console.error('Error updating call_logs:', error)
    }

    return new Response('<Response/>', {
      headers: { 'Content-Type': 'text/xml' },
      status: 200,
    })
  } catch (error) {
    console.error('Recording status error:', error)
    return new Response('Error', { status: 500 })
  }
})
