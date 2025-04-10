export interface Env {
  AI: import('@cloudflare/ai').Ai; // Cloudflare AI binding
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      // Call Workers AI endpoint
      try {
        const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello, who are you?' }
          ]
        });

        return Response.json({
          name: "Cloudflare",
          aiResponse
        });
      } catch (error) {
        return Response.json({
          error: "AI processing failed",
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
    }
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
