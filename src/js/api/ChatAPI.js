import Entity from "./Entity";
import createRequest from "./createRequest";

export default class ChatAPI extends Entity {
  constructor() {
    super('https://chat-backend-1-asum.onrender.com')
  }

  createUser (name) {
    return createRequest(new URL('/new-user', this.baseUrl), {
      method: 'POST',
      body: { name },
    });
  }

  wsUrl() {
    return this.baseUrl.replace('http', 'ws');
  }
}
