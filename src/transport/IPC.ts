// deno-lint-ignore-file require-await no-async-promise-executor no-explicit-any
import { Buffer, fs, net, path } from "../../deps.ts";
import { Transport, TransportOptions } from "../structures/Transport.ts";

export enum IPC_OPCODE {
  HANDSHAKE,
  FRAME,
  CLOSE,
  PING,
  PONG,
}

export type FormatFunction = (
  id: number,
) => [path: string, skipCheck?: boolean];

export type IPCTransportOptions = {
  pathList?: FormatFunction[];
} & TransportOptions;

const defaultPathList: FormatFunction[] = [
  (id: number): [string, boolean] => {
    // Windows path

    const isWindows = Deno.build.os === "windows";

    return [isWindows ? `\\\\?\\pipe\\discord-ipc-${id}` : "", isWindows];
  },
  (id: number): [string] => {
    // macOS/Linux path

    if (Deno.build.os === "windows") return [""];

    const { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } = Deno.env.toObject();

    const prefix = Deno.realPathSync(
      XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`,
    );
    return [path.join(prefix, `discord-ipc-${id}`)];
  },
  (id: number): [string] => {
    // Snap path

    if (Deno.build.os === "windows") return [""];

    const { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } = Deno.env.toObject();

    const prefix = Deno.realPathSync(
      XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`,
    );
    return [path.join(prefix, "snap.discord", `discord-ipc-${id}`)];
  },
  (id: number): [string] => {
    // Alternative snap path

    if (Deno.build.os === "windows") return [""];

    const { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } = Deno.env.toObject();

    const prefix = Deno.realPathSync(
      XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`,
    );
    return [
      path.join(prefix, "app", "com.discordapp.Discord", `discord-ipc-${id}`),
    ];
  },
];

const createSocket = async (path: string): Promise<net.Socket> => {
  return new Promise((resolve, reject) => {
    const onError = () => {
      socket.removeListener("conect", onConnect);
      reject();
    };

    const onConnect = () => {
      socket.removeListener("error", onError);
      resolve(socket);
    };

    const socket = net.createConnection(path);

    socket.once("connect", onConnect);
    socket.once("error", onError);
  });
};

export class IPCTransport extends Transport {
  pathList: FormatFunction[] = defaultPathList;

  private socket?: net.Socket;

  constructor(options: IPCTransportOptions) {
    super(options);

    if (options.pathList) this.pathList = options.pathList;
  }

  private async getSocket(): Promise<net.Socket> {
    if (this.socket) return this.socket;

    const pathList = this.pathList;
    return new Promise(async (resolve, reject) => {
      for (const formatFunc of pathList) {
        const tryCreateSocket = async (path: string) => {
          const socket = await createSocket(path).catch(() => null);
          return socket;
        };

        const handleSocketId = async (
          id: number,
        ): Promise<net.Socket | null> => {
          const [socketPath, skipCheck] = formatFunc(id);

          if (!skipCheck && !fs.existsSync(path.dirname(socketPath))) {
            return null;
          }

          const socket = await tryCreateSocket(socketPath);
          return socket;
        };

        if (this.client.instanceId) {
          const socket = await handleSocketId(this.client.instanceId);
          if (socket) {
            resolve(socket);
            break;
          }
        } else {
          for (let i = 0; i < 10; i++) {
            const socket = await handleSocketId(i);
            if (socket) {
              resolve(socket);
              break;
            }
          }
        }
      }

      reject(new Error("Could not connect"));
    });
  }

  async connect(): Promise<void> {
    if (this.socket) return;

    this.socket = await this.getSocket().catch((err) => {
      throw err;
    });

    this.emit("open");

    this.send(
      {
        v: 1,
        client_id: this.client.clientId,
      },
      IPC_OPCODE.HANDSHAKE,
    );

    let chunk: Buffer | null;
    let sizeRemaining: number | null;

    const onData = async (data: Buffer) => {
      if (!this.socket) return;

      const wholeData = chunk
        ? Buffer.concat([chunk, data.subarray(0, sizeRemaining!)])
        : data;
      const remainingData = sizeRemaining ? data.subarray(sizeRemaining) : null; // Fail-safe, this happened while testing but never came back again

      const length = wholeData.readUInt32LE(4);
      const jsonData = wholeData.subarray(8);

      sizeRemaining = length - jsonData.length;

      if (this.client.debug) {
        this.client.logger.debug(
          `| [SERVER] => [CLIENT] | Recieved ${data.length} bytes, missing ${sizeRemaining} bytes, left over ${
            remainingData?.length ?? 0
          } bytes | Whole packet length: ${wholeData.length}, Required packet length: ${
            length + 8
          }`,
        );
      }

      if (sizeRemaining && sizeRemaining > 0) {
        chunk = wholeData;
        return;
      } else {
        chunk = null;
        sizeRemaining = null;
      }

      const packet = {
        op: wholeData.readUInt32LE(0),
        length: length,
        data: length > 0 ? JSON.parse(jsonData.toString()) : null, // Should not error at all, If it does, open an Issue on GitHub.
      };

      if (this.client.debug) {
        this.client.logger.debug(
          `| [SERVER] => [CLIENT] | OPCODE.${IPC_OPCODE[packet.op]} | ${
            JSON.stringify(packet.data, null, 2)
          }`,
        );
      }

      switch (packet.op) {
        case IPC_OPCODE.FRAME: {
          if (!packet.data) break;

          this.emit("message", packet.data);
          break;
        }
        case IPC_OPCODE.CLOSE: {
          this.emit("close");
          break;
        }
        case IPC_OPCODE.PING: {
          this.send(packet.data, IPC_OPCODE.PONG);
          this.emit("ping");
          break;
        }
      }

      if (remainingData && remainingData.length > 0) onData(remainingData);
    };

    this.socket.on("data", onData);
  }

  send(message?: any, op: IPC_OPCODE = IPC_OPCODE.FRAME): void {
    if (this.client.debug) {
      this.client.logger.debug(
        `| [CLIENT] => [SERVER] | OPCODE.${IPC_OPCODE[op]}`,
        message,
      );
    }

    const dataBuffer = message
      ? Buffer.from(JSON.stringify(message))
      : Buffer.alloc(0);

    const packet = Buffer.alloc(8);
    packet.writeUInt32LE(op, 0);
    packet.writeUInt32LE(dataBuffer.length, 4);

    this.socket?.write(Buffer.concat([packet, dataBuffer]));
  }

  ping(): void {
    this.send(crypto.randomUUID(), IPC_OPCODE.PING);
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.once("close", resolve);
      this.send({}, IPC_OPCODE.CLOSE);
      this.socket?.end();
    });
  }
}
