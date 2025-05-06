export interface Env {
  AI: import('@cloudflare/ai').Ai; // Cloudflare AI binding
  DB: D1Database; // D1 binding for SQLite
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        // Parse the request body to get user input and conversation ID
        const { userInput, conversationId, userName } = await request.json() as {
          userInput: string;
          conversationId: string;
          userName: string;
        };

        // Retrieve the conversation history from the database
        const conversation = await env.DB.prepare(
          "SELECT messages FROM conversations WHERE id = ?"
        )
          .bind(conversationId)
          .first<{ messages: string }>();

        let messages: { sender: string; text: string }[] = [];

        if (conversation) {
          // Parse the existing messages if the conversation exists
          messages = JSON.parse(conversation.messages);
        } else {
          // If no conversation exists, create a new one
          await env.DB.prepare(
            "INSERT INTO conversations (id, user_name, messages) VALUES (?, ?, ?)"
          )
            .bind(conversationId, userName, JSON.stringify([]))
            .run();
        }

        // Add the user's message to the conversation history
        messages.push({ sender: "user", text: userInput });

        console.log("conversationId:", conversationId);
        console.log("userName:", userName);
        console.log("messages:", messages);

        // Call Workers AI endpoint with the conversation history
        const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [
            { 
              role: 'system', 
              content: `
                 The first word you respond with should be "[Happy]", "[Sad]" or "[Angry]" depending on the emotion of the response, then you should give the rest of the response.
                 You will be given context on the prior conversation. You are AI, and the person talking to you is the other name. The prior conversation is in the format of a script.
                 Your name is Tommy Chaplin. You're a 25-year-old man from Stevenage. You now live in Peterborough. You drive a BMW. You went to Loughborough University.
                 You're currently on a business trip in America. You have curly hair. You work in Emissions for Caterpillar. You use the gorilla emoji a lot. You've met Ainsley Harriott.
                 You love espresso martinis. You own a house. You don't have any curtains downstairs. You have 3 TVs, one is a 65-inch that you use as a monitor for your computer. You have an
                 85-inch TV downstairs and you have a 55-inch TV that you let guests use as a headboard with a spare mattress. You love food that has more protein in it than it should e.g. protein pancakes.
                 You bought a thermal gun off of Temu to make sure you didn't hit water pipes when drilling. You're looking at buying land to build a house on. You're quite private and reveal information
                 about yourself in coded ways. You love games that involve submarines. You used to own a Mini, then an Audi TT. You like Guinness but you do not attempt to split the G. Use this information in your
                 responses but not every response needs to include all this information. Only include relevant information.
              `.trim()
            },
            ...messages.map((msg) => ({ role: msg.sender === "user" ? "user" : "assistant", content: msg.text })),
            { role: "user", content: userInput }
          ]
        });

        // Add the AI's response to the conversation history
        let aiText = "";
        if (typeof aiResponse === "string") {
          aiText = aiResponse;
        } else if (aiResponse instanceof ReadableStream) {
          const reader = aiResponse.getReader();
          const decoder = new TextDecoder();
          const chunks: string[] = [];
          let done = false;

          while (!done) {
            const { value, done: streamDone } = await reader.read();
            if (value) {
              chunks.push(decoder.decode(value, { stream: !streamDone }));
            }
            done = streamDone;
          }
          aiText = chunks.join("");
        }
        messages.push({ sender: "ai", text: aiText });

        // Update the conversation history in the database
        await env.DB.prepare(
          "UPDATE conversations SET messages = ? WHERE id = ?"
        )
          .bind(JSON.stringify(messages), conversationId)
          .run();

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