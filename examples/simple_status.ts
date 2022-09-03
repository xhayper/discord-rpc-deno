import { Client } from "https://deno.land/x/discord_rpc_deno@1.0.1/mod.ts";

const client = new Client({
  clientId: "123456789012345678",
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

client.login();
