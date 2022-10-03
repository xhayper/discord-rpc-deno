export { grantOrThrow } from "https://deno.land/std@0.158.0/permissions/mod.ts";
export { EventEmitter } from "https://deno.land/std@0.158.0/node/events.ts"; // TODO: Stop using node!
export { Buffer } from "https://deno.land/std@0.158.0/node/buffer.ts"; // TODO: Stop using node!

export * as path from "https://deno.land/std@0.158.0/path/mod.ts";
export * as net from "https://deno.land/std@0.158.0/node/net.ts"; // TODO: Stop using node!
export * as log from "https://deno.land/std@0.158.0/log/mod.ts";
export * as fs from "https://deno.land/std@0.158.0/fs/mod.ts";

export type {
  ActivityType,
  APIApplication,
  APIAttachment,
  APIEmbed,
  ChannelType,
  GatewayActivity,
  GatewayActivityButton,
  GatewayVoiceState,
  MessageType,
  OAuth2Scopes,
  PresenceUpdateStatus,
  UserFlags,
  UserPremiumType,
} from "https://deno.land/x/discord_api_types@0.37.11/v10.ts";
