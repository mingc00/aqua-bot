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

  new Server((socket) => {
    let msg = '';
    socket.on('data', (chunk) => {
      msg += chunk;
    });
    socket.on('end', async () => {
      const user = await client.users.fetch(NOTIFY_USER as `${bigint}`);
      await user.send(msg);
    });
  }).listen(sock);
}
