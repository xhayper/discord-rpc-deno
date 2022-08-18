// deno-lint-ignore-file no-explicit-any
// import { StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { Transport } from "../structures/Transport.ts";

export class WebSocketTransport extends Transport {
  private ws?: WebSocket;

  connect(): Promise<void> {
    throw new Error("WebSocketTransport.connect() is not implemented");

    // return new Promise(async (resolve, reject) => {
    //   for (let i = 0; i < 10; i++) {
    //     const ws = await new Promise<WebSocket>((resolve, reject) => {
    //       const socket = new StandardWebSocketClient(
    //         `ws://127.0.0.1:${6463 + i}/?v=1&client_id=${
    //           this.client.clientId
    //         }&encoding=json`,
    //         {
    //           origin: this.client.origin,
    //         }
    //       );

    //       socket.onopen = () => {
    //         socket.onclose = null;
    //         socket.onopen = null;

    //         resolve(socket);
    //       };

    //       socket.onerror = () => {
    //         socket.onclose = null;
    //         socket.onopen = null;

    //         reject();
    //       };
    //     }).catch(() => null);

    //     if (ws) {
    //       this.ws = ws;
    //       resolve();
    //       break;
    //     }
    //   }

    //   if (!this.ws) reject(new Error("Failed to connect to websocket"));

    //   this.ws!.onmessage = (event) => {
    //     this.emit("message", JSON.parse(event.data.toString()));
    //   };

    //   this.ws!.onclose = (event) => {
    //     if (!event.wasClean) return;
    //     this.emit("close");
    //   };

    //   this.ws!.onerror = (event) => {
    //     try {
    //       this.ws?.close();
    //     } catch {}

    //     throw event.error;
    //   };

    //   this.emit("open");
    // });
  }

  send(_data?: any): void {
    throw new Error("WebSocketTransport.send() is not implemented");

    // this.ws?.send(JSON.stringify(data));
  }

  ping(): void {}

  close(): Promise<void> {
    throw new Error("WebSocketTransport.close() is not implemented");

    // return new Promise((resolve) => {
    //   this.once("close", resolve);
    //   this.ws?.close();
    // });
  }
}