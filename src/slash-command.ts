import axios, { AxiosInstance } from 'axios';

import type { Client, WebSocketShard } from 'discord.js';

const BASE_URL = 'https://discord.com/api/v8';

export class SlashCommandController {
  private appId: string;
  private botToken: string;
  private guildId?: string;
  private api: AxiosInstance;

  constructor(appId: string, botToken: string, guildId?: string) {
    this.appId = appId;
    this.botToken = botToken;
    this.guildId = guildId;
    this.api = axios.create({
      baseURL: `${BASE_URL}/applications/${appId}${
        guildId ? `/guilds/${guildId}` : ''
      }/commands`,
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
  }

  public create(data: unknown): Promise<boolean> {
    return this.api
      .post<{ name: string; options: Array<{ name: string }> }>('', data)
      .then((resp) => {
        console.log(
          'create slash command:',
          `/${resp.data.name} ${resp.data.options
            .map((option: { name: string }) => `[${option.name}]`)
            .join(' ')}`
        );
        return true;
      })
      .catch((e) => {
        logAPIError('failed to create command', e);
        return false;
      });
  }

  public delete(id: string): Promise<boolean> {
    return this.api
      .delete(id)
      .then(() => true)
      .catch((e) => {
        logAPIError('failed to delete command', e);
        return false;
      });
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  static registerHandler(
    client: Client,
    name: string,
    handler: (options: any) => any | null
  ): void {
    const handlePacketFn = (client.ws as any).handlePacket;
    (client.ws as any).handlePacket = function (
      packet?: { t: string; d: any },
      shard?: WebSocketShard
    ) {
      const ret = handlePacketFn.call(this, packet, shard);
      if (ret === true && packet && packet.t === 'INTERACTION_CREATE') {
        const { id, token, data } = packet.d;
        if (data.name !== name) {
          return;
        }
        const responseMessage = handler(data.options);
        const payload = responseMessage
          ? {
              type: 4,
              data: responseMessage,
            }
          : { type: 2 };
        axios
          .post(`${BASE_URL}/interactions/${id}/${token}/callback`, payload)
          .catch((e) => logAPIError('failed to send callback', e));
      }
    };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

function logAPIError(msg: string, e: { response?: { data?: unknown } }) {
  if (e.response) {
    console.error(msg, e.response.data);
  }
}
