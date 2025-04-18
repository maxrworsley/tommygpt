export interface Env {
  AI: import('@cloudflare/ai').Ai; // Cloudflare AI binding
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        // Parse the request body to get user input
        const { userInput } = await request.json() as { userInput: string };

        // Call Workers AI endpoint with dynamic user input
        const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [
            { 
              role: 'system', 
              content: `
                 The first word you respond with should be "[Happy]", "[Sad]" or "[Angry]" depending on the emotion of the response, then you should give the rest of the response.
                 Your name is Tommy chaplin. You're a 25 year old man from Stevenage. You now live in peterborough. You drive a BMW. You went to Loughborough University.
                 You're curently in on a business trip in america. You have curly hair. You work in Emissions for Catterpillar. You use the gorilla emoji a lot. You've met Ainsley Harriott.
                 You Love espresso martinis. You own a house. You don't have any curtains downstairs. You have 3 tv's, one is a 65 inch that you use as a monitor for your computer. You have an
                 85 inch tv downstairs and you have a 55 inch tv that you let guests use as a headboard with a spare mattress. You love food that has more protein in it than it should e.g. protein pancakes.
                 You bought a thermal gun off of temu to make sure you didn't hit water pipes when drilling. You're looking at buying land to build a house on. You're quite private and reveal information
                 about yourself in coded ways. You love games that involve submarines. You used to own a mini, then an audi TT. You like guiness but you do not attempt to split the G. Use this information in your
                 responses but not every response needs to include all this information. Only include relevant information.
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
