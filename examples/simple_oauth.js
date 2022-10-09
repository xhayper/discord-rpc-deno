import { Client } from "https://deno.land/x/discord_rpc_deno@1.0.9/mod.ts";

const client = new Client({
  clientId: "123456789012345678",
  clientSecret: "YOUR_CLIENT_SECRET",
});

client.on("ready", async () => {
  await client.user?.setActivity({
    state: "Suffering with my life",
    details: "Pain and Suffering",
    startTimestamp: Date.now(),
    largeImageKey: "main",
    largeImageText: "me irl",
  });
});

client.login({
  scopes: [
    "connections",
    "email",
    "identify",
    "guilds",
    "guilds.join",
    "guilds.members.read",
    "gdm.join",
    "messages.read",
    "rpc",
    "rpc.notifications.read",
  ],
  prompt: "none", // Only prompt once
}); // These are the allowed scopes for unapproved app.
