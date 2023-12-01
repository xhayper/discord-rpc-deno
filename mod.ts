let _envPermissionGranted = false;

{
  const status = await Deno.permissions.request({ name: "env" });

  if (status.state === "denied") {
    console.warn("Failed to request env permission, IPC transport!");
  }

  _envPermissionGranted = status.state === "granted";
}

/*
TODO: Rework this

if (envPermissionGranted) {
  const { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } = Deno.env.toObject();
  const requiredPath = XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `/tmp`;

  {
    const status = await Deno.permissions.request({
      name: "read",
      path: requiredPath,
    });

    if (status.state === "denied") {
      console.warn(
        `Failed to request read permission for '${requiredPath}', IPC transport will not work!`
      );
    }
  }

  {
    const status = await Deno.permissions.request({
      name: "write",
      path: requiredPath,
    });

    if (status.state === "denied") {
      console.warn(
        `Failed to request write permission for '${requiredPath}', IPC transport will not work!`
      );
    }
  }
}
*/

{
  const status = await Deno.permissions.request({
    name: "net",
    host: "discord.com",
  });

  if (status.state === "denied") {
    console.warn(
      "Failed to request net permission for 'discord.com', OAuth will not work!",
    );
  }
}

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

export { type FormatFunction } from "./src/transport/IPC.ts";
