import { skinOf, type SkinId } from './appearance-model.ts';

// Independent generated paintings, served locally; never interpolate preference input into URLs.
const scenes: Record<SkinId, {name: string; art: string}> = {
  mint: {name: '晨光花园', art: '/assets/skins/mint-hero-v2.png'},
  blue: {name: '静海书房', art: '/assets/skins/blue-hero-v2.png'},
  sakura: {name: '樱色来信', art: '/assets/skins/sakura-hero-v2.png'},
  violet: {name: '月夜茶室', art: '/assets/skins/violet-hero-v2.png'},
  amber: {name: '晴日出发', art: '/assets/skins/amber-hero-v2.png'},
};

export function companionScene(id: unknown) { return scenes[skinOf(id).id]; }
