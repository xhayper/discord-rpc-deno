import Payload from "https://unpkg.com/discord-api-types@0.37.2/payloads/v10/index.d.ts";
import { Client } from "../Client.ts";
import { Base } from "./Base.ts";

export class User extends Base {
  /**
   * the user's id
   */
  id: string;
  /**
   * the user's username, not unique across the platform
   */
  username: string;
  /**
   * the user's 4-digit discord-tag
   */
  discriminator: string;
  /**
   * the user's [avatar hash](https://discord.com/developers/docs/reference#image-formatting)
   */
  avatar: string | null;
  /**
   * the [flags](https://discord.com/developers/docs/resources/user#user-object-user-flags) on a user's account
   */
  flags?: Payload.UserFlags | undefined;
  /**
   * the [type of Nitro subscription](https://discord.com/developers/docs/resources/user#user-object-premium-types) on a user's account
   */
  premium_type?: Payload.UserPremiumType | undefined;
  /**
   * the public [flags](https://discord.com/developers/docs/resources/user#user-object-user-flags) on a user's account
   */
  public_flags?: Payload.UserFlags | undefined;

  /**
   * user's rich presence
   */
  presence?:
    | {
        status?: Payload.PresenceUpdateStatus;
        activities?: Payload.GatewayActivity[];
      }
    | undefined;

  avatar_decoration?: string | null;

  constructor(client: Client, props: any) {
    super(client);
    Object.assign(this, props);

    // word can't explains how much i hate this
    this.id = props.id;
    this.username = props.username;
    this.discriminator = props.discriminator;
    this.avatar = props.avatar;
  }

  /**
   * The URL to the user's avatar.
   */
  get avatarUrl() {
    const isAnimated = this.avatar && this.avatar.startsWith("a_");
    return this.avatar
      ? `${this.client.cdnHost}/avatars/${this.id}/${this.avatar}${
          isAnimated ? ".gif" : ".png"
        }`
      : this.defaultAvatarUrl;
  }

  /**
   * The URL to the user's default avatar. (avatar that is used when user have no avatar)
   */
  get defaultAvatarUrl() {
    return `${this.client.cdnHost}/embed/avatars/${
      parseInt(this.discriminator.substring(1)) % 5
    }.png`;
  }

  /**
   * User's tag
   */
  get tag() {
    return `${this.username}#${this.discriminator}`;
  }
}
