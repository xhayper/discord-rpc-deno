import { grantOrThrow } from "./deps.ts";
grantOrThrow({ name: "read" }, { name: "write" }, { name: "env" });

export * from "./src/Client.ts";
export * from "./src/structures/ClientUser.ts";
export * from "./src/structures/CertifiedDevice.ts";
export * from "./src/structures/Channel.ts";
export * from "./src/structures/Guild.ts";
export * from "./src/structures/Lobby.ts";
export * from "./src/structures/User.ts";
export * from "./src/structures/VoiceSettings.ts";
export * from "./src/structures/Transport.ts";
export * from "./src/structures/Message.ts";

export * from "./src/transport/IPC.ts";
