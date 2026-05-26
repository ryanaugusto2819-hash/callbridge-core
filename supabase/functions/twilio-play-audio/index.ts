import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Toca um áudio para TODOS os participantes da conference
// (agente + cliente) usando a API de Announce da Conference.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { callSid, audioUrl } = await req.json();
    if (!callSid || !audioUrl) {
      return new Response(JSON.stringify({ error: 'callSid e audioUrl são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    if (!sid || !token) {
      return new Response(JSON.stringify({ error: 'Twilio não configurado' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const auth = btoa(`${sid}:${token}`);

    // 1) Descobre a Conference: friendlyName = callSid do agente
    const confListUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Conferences.json?FriendlyName=${encodeURIComponent(callSid)}&Status=in-progress`;
    const confRes = await fetch(confListUrl, { headers: { 'Authorization': `Basic ${auth}` } });
    const confData = await confRes.json();
    if (!confRes.ok) {
      console.error('list conferences error', confData);
      return new Response(JSON.stringify({ error: 'Falha ao listar conferências', details: confData }), {
        status: confRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const conf = (confData.conferences || [])[0];
    if (!conf) {
      return new Response(JSON.stringify({ error: 'Conferência ativa não encontrada para esta chamada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Toca áudio na conference inteira via AnnounceUrl
    const announceUrl = `${SUPABASE_URL}/functions/v1/twilio-announce-twiml?audio=${encodeURIComponent(audioUrl)}`;
    const updRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Conferences/${conf.sid}.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ AnnounceUrl: announceUrl, AnnounceMethod: 'GET' }),
    });
    const updData = await updRes.json();
    if (!updRes.ok) {
      console.error('conference announce error', updData);
      return new Response(JSON.stringify({ error: updData.message || 'Erro ao anunciar áudio', details: updData }), {
        status: updRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, conferenceSid: conf.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('twilio-play-audio error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});