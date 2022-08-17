import { Client } from "../Client.ts";

export class Base {
  /**
   * the client instance
   */
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }
}
