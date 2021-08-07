import { Server } from 'net';
import { unlink } from 'fs/promises';
import path from 'path';
import type { Client } from 'discord.js';

const NOTIFY_USER = process.env.NOTIFY_USER || '';

export async function createNotifier(client: Client): Promise<void> {
  const sock = path.resolve('./discord_notify');
  try {
    await unlink(sock);
  } catch {}

  if (!NOTIFY_USER) {
    return;
  }

  new Server((socket) => {
    let msg = '';
    socket.on('data', (chunk) => {
      msg += chunk;
    });
    socket.on('end', async () => {
      if (!msg) {
        return;
      }
      try {
        const user = await client.users.fetch(NOTIFY_USER as `${bigint}`);
        await user.send(msg);
      } catch (e) {
        console.error(e);
      }
    });
  }).listen(sock);
}
