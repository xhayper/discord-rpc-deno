export { EventEmitter } from "node:events"; // TODO: Stop using node!

export * as bytes from "https://deno.land/std@0.208.0/bytes/mod.ts";
export * as path from "https://deno.land/std@0.208.0/path/mod.ts";
export * as net from "node:net"; // TODO: Stop using node!

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
} from "https://deno.land/x/discord_api_types@0.37.63/v10.ts";
