import { DurableObjectState, DurableObjectStorage } from "@cloudflare/workers-types";

export class Conversation {
    state: DurableObjectState;
    storage: DurableObjectStorage;
  
    constructor(state: DurableObjectState) {
      this.state = state;
      this.storage = state.storage;
    }
  
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
  
      if (url.pathname === "/conversation") {
        const { action, message } = await request.json();
  
        if (action === "addMessage") {
          // Add a message to the conversation history
          const history = (await this.storage.get<string[]>("history")) || [];
          history.push(message);
          await this.storage.put("history", history);
          return new Response(JSON.stringify({ success: true, history }), { status: 200 });
        }
  
        if (action === "getHistory") {
          // Retrieve the conversation history
          const history = (await this.storage.get<string[]>("history")) || [];
          return new Response(JSON.stringify({ history }), { status: 200 });
        }
      }
  
      return new Response("Not Found", { status: 404 });
    }
  }