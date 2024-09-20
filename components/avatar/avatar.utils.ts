export const getAvatarSrc = (fileName: string) => `/assets/trainers/${fileName}`;

export const getMainSelectableAvatars = (images: string[], userId: string) => {
  let exclusiveAvatars = ['ace trainer', 'cynthia', 'bunny', 'pokemon-center-lady', 'N.png', 'ghetsis', 'riley'];
  const bunnyUserId = 'f0a37b75-3ecb-4aaa-a5ac-ecb679685ed2';

  if (userId === bunnyUserId) {
    exclusiveAvatars = exclusiveAvatars.filter((avatar) => avatar !== 'bunny');
  }

  return images.filter((img) => !exclusiveAvatars.some((avatar) => img.includes(avatar)));
}
