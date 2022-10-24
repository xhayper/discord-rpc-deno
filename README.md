<!-- markdownlint-disable -->
<div align="center">
    <br />
    <h3>discord_rpc_deno</h3>
    <br />
    <p>
        <a href="https://deno.land/x/discord_rpc_deno"><img src="https://img.shields.io/github/v/release/xhayper/discord-rpc-deno?include_prereleases&label=deno&logo=deno" alt="deno"/></a>
        <a href="https://discord.com/invite/xTAR8nUs2g" target="_blank"><img src="https://img.shields.io/discord/965168309731487805.svg" alt="discord"/></a>
        <a href="https://github.com/xhayper/discord-rpc-deno/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/xhayper/discord-rpc-deno.svg" alt="license"/></a>
    </p>
</div>
<!-- markdownlint-enable -->

## About

`discord_rpc_deno` is a port of
[@xhayper/discord-rpc](https://github.com/xhayper/discord-rpc) to deno.

Looking for NodeJS version? Check
[@xhayper/discord-rpc](https://github.com/xhayper/discord-rpc)!

NOTE: Require `--unstable --allow-read --allow-env --allow-write --allow-net`!

## Features

- flatpak / snap support
- Proper Error exception
- Up-To-Date with Discord IPC's Command

## Example

```ts
import { Client } from "https://deno.land/x/discord_rpc_deno@1.0.11/mod.ts";

const client = new Client({
  clientId: "123456789012345678",
});

client.on("ready", () => {
  client.user?.setActivity({
    state: "Hello, world!",
  });
});

client.login();
```

## Compatibility

| OS      | Normal | snap | flatpak |
| ------- | ------ | ---- | ------- |
| Windows | Y      | -    | -       |
| macOS   | Y      | -    | -       |
| Linux   | Y      | Y    | Y       |

- Linux is tested on Kubuntu 22.04

## Credits

- [discordjs](https://github.com/discordjs): Making
  [discordjs/RPC](https://github.com/discordjs/RPC)
- [JakeMakesStuff](https://github.com/JakeMakesStuff):
  [snap support](https://github.com/discordjs/RPC/pull/152)
- [Snazzah](https://github.com/Snazzah):
  [snap + flatpak support](https://github.com/Snazzah/SublimeDiscordRP/blob/c13e60cdbc5de8147881bb232f2339722c2b46b4/discord_ipc/__init__.py#L208)
- [leonardssh](https://github.com/leonardssh): Making
  [coc-discord-rpc](https://github.com/leonardssh/coc-discord-rpc) which
  inspried me to make this package due to how old
  [discordjs/RPC](https://github.com/discordjs/RPC) is
