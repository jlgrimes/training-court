import fs from 'fs'
import path from 'path'

export function fetchAvatarImages() {
  const dirRelativeToPublicFolder = 'assets/trainers'
  const dir = path.resolve('./public', dirRelativeToPublicFolder);
  const filenames = fs.readdirSync(dir);

  return filenames.map(name => path.join('/', dirRelativeToPublicFolder, name))
}