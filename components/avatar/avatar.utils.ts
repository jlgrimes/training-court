import { bunnyUserId } from "../premium/premium.utils";

export const getAvatarSrc = (fileName: string) => `/assets/trainers/${fileName}`;

export const getMainSelectableAvatars = (images: string[], userId: string) => {
  let exclusiveAvatars = ['ace trainer', 'cynthia', 'bunny', 'pokemon-center-lady', 'N.png', 'ghetsis', 'riley'];

  if (userId === bunnyUserId) {
    exclusiveAvatars = exclusiveAvatars.filter((avatar) => avatar !== 'bunny');
  }

  return images.filter((img) => !exclusiveAvatars.some((avatar) => img.includes(avatar)));
}
