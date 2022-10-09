// deno-lint-ignore-file require-await no-async-promise-executor no-explicit-any
import { Buffer, net, path } from "../../deps.ts";
import { RPCError } from "../utils/RPCError.ts";
import {
  CUSTOM_RPC_ERROR_CODE,
  Transport,
  TransportOptions,
} from "../structures/Transport.ts";

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
    // snap

    if (Deno.build.os === "windows") return [""];

    const { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } = Deno.env.toObject();

    const prefix = Deno.realPathSync(
      XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`,
    );
    return [path.join(prefix, "snap.discord", `discord-ipc-${id}`)];
  },
  (id: number): [string] => {
    // flatpak

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

// https://stackoverflow.com/a/61868755
const exists = async (filename: string): Promise<boolean> => {
  try {
    await Deno.stat(filename);
    return true;
  } catch (error) {
    if (error && error.kind === Deno.errors.NotFound) {
      return false;
    } else {
      throw error;
    }
  }
};

export class IPCTransport extends Transport {
  pathList: FormatFunction[] = defaultPathList;

  private socket?: net.Socket;

  get isConnected() {
    return this.socket != undefined && this.socket.readyState === "open";
  }

  constructor(options: IPCTransportOptions) {
    super(options);

    this.pathList = options.pathList ?? this.pathList;
  }

  private async getSocket(): Promise<net.Socket> {
    if (this.socket) return this.socket;

    const pathList = this.pathList;
    return new Promise(async (resolve, reject) => {
      for (const formatFunc of pathList) {
        const tryCreateSocket = async (path: string) => {
          const socket = await createSocket(path).catch(() => undefined);
          return socket;
        };

        const handleSocketId = async (
          id: number,
        ): Promise<net.Socket | undefined> => {
          const [socketPath, skipCheck] = formatFunc(id);

          if (!skipCheck && !(await exists(path.dirname(socketPath)))) {
            return;
          }

          const socket = await tryCreateSocket(socketPath);
          return socket;
        };

        if (this.client.pipeId) {
          const socket = await handleSocketId(this.client.pipeId);
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

      reject(
        new RPCError(
          CUSTOM_RPC_ERROR_CODE.RPC_COULD_NOT_CONNECT,
          "Could not connect",
        ),
      );
    });
  }

  async connect(): Promise<void> {
    if (!this.socket) {
      this.socket = await this.getSocket().catch((err) => {
        throw err;
      });
    }

    this.emit("open");

    this.send(
      {
        v: 1,
        client_id: this.client.clientId,
      },
      IPC_OPCODE.HANDSHAKE,
    );

    let chunk: Buffer | undefined;
    let sizeRemaining: number | undefined;

    const onData = async (data: Buffer) => {
      if (!this.socket) return;

      const wholeData = chunk
        ? Buffer.concat([chunk, data.subarray(0, sizeRemaining!)])
        : data;
      const remainingData = sizeRemaining
        ? data.subarray(sizeRemaining)
        : undefined; // Fail-safe, this happened while testing but never came back again

      const length = wholeData.readUInt32LE(4);
      const jsonData = wholeData.subarray(8);

      sizeRemaining = length - jsonData.length;

      if (this.client.debug) {
        this.client.logger.debug(
          `| [SERVER] => [CLIENT] | Recieved ${data.length} bytes, missing ${sizeRemaining} bytes, left over ${
            remainingData?.length ?? 0
          } bytes | Whole packet length: ${wholeData.length}, Required packet length: ${
            length + 8
          } | Packet data: ${
            jsonData
              .toString("hex")
              .match(/.{1,2}/g)
              ?.join(" ")
          }`,
        );
      }

      if (sizeRemaining && sizeRemaining > 0) {
        chunk = wholeData;
        return;
      } else {
        chunk = undefined;
        sizeRemaining = undefined;
      }

      const packet = {
        op: wholeData.readUInt32LE(0),
        length: length,
        data: length > 0 ? JSON.parse(jsonData.toString()) : undefined, // Should not error at all, If it does, open an Issue on GitHub.
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
          this.emit("close", packet.data);
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
        `| [CLIENT] => [SERVER] | OPCODE.${IPC_OPCODE[op]} | ${
          JSON.stringify(
            message,
            null,
            2,
          )
        }`,
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
    if (!this.socket) return new Promise((resolve) => void resolve());

    return new Promise((resolve) => {
      this.socket!.once("close", () => {
        this.emit("close", "Closed by client");
        this.socket = undefined;
        resolve();
      });
      this.socket!.end();
    });
  }
}
