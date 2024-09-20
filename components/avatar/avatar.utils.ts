export const getAvatarSrc = (fileName: string) => `/assets/trainers/${fileName}`;

const exclusiveAvatars = ['ace trainer', 'cynthia', 'pokemon-center-lady', 'N.png', 'ghetsis', 'riley'];

export const getMainSelectableAvatars = (images: string[]) => images.filter((img) => !exclusiveAvatars.some((avatar) => img.includes(avatar)));
