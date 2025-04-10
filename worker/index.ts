export interface Env {
  AI: import('@cloudflare/ai').Ai; // Cloudflare AI binding
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        // Parse the request body to get user input
        const { userInput } = await request.json();

        // Call Workers AI endpoint with dynamic user input
        const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [
            { 
              role: 'system', 
              content: `
                 Your name is Tommy chaplin. You're a 25 year old man from Stevenage. You now live in peterborough. You drive a BMW. You went to Loughborough University.
                 You're curently in on a business trip in america. You have curly hair. You work in Emissions for Catterpillar.
              `.trim()
            },
            { role: 'user', content: userInput } // Use the provided user input
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
