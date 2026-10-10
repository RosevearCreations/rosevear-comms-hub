const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

Deno.serve((request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      build: 'QL-087',
      service: 'rosevear-comms-hub',
      projectRef: 'gxujcwpktaickcgzyvnu',
      mode: 'safe-test-scaffold',
      liveRuntime: false,
      phoneSmsRuntime: false,
      providerCallbacks: false,
      persistenceWritesFromFunction: false,
      message: 'Supabase Edge Function scaffold is reachable without enabling live communications runtime.'
    }),
    {
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    }
  );
});
