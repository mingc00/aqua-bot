import { EmbedBuilder } from 'discord.js';

export interface EmbedConfig {
  url: string;
  title: string;
  author?: string;
  description?: string;
  thumbnail?: string;
}

export function createMessageEmbed({
  url,
  title,
  author = '',
  description = '',
  thumbnail,
}: EmbedConfig): EmbedBuilder {

  const embed = new EmbedBuilder()
    .setURL(url)
    .setTitle(title)
    .setDescription(
      description.length > 100
        ? `${description.substr(0, 100)}...`
        : description
    );

  if (author) {
    embed.setAuthor({ name: author });
  }
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }
  return embed;
}
