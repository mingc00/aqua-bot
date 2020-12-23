import fs from 'fs';
import { MessageEmbed } from 'discord.js';

export default class ImageCommandHandler {
  private images: {
    [command: string]: {
      description: string;
      urls: string[];
      footer?: string;
    };
  };

  constructor() {
    this.images = {};
    this.load();
  }

  private load(): void {
    try {
      const images = JSON.parse(
        fs.readFileSync('./commands/images.json', 'utf-8')
      );
      if (typeof images === 'object') {
        this.images = images;
      }
    } catch (e) {}
  }

  public getChoices(): CommandChoice[] {
    return Object.keys(this.images).map((k) => {
      const image = this.images[k];
      return {
        name: image.description,
        value: k,
        description: image.footer,
      };
    });
  }

  public get(command: string): MessageEmbed | null {
    const r = this.images[command];
    if (!r || r.urls.length === 0) {
      return null;
    }
    const url = randomPick(r.urls);
    const embed = new MessageEmbed().setImage(url);
    if (r.footer) {
      embed.setFooter(r.footer);
    }
    return embed;
  }
}

function randomPick<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

interface CommandChoice {
  name: string;
  value: string;
  description?: string;
}
