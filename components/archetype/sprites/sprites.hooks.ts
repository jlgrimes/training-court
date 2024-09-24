import useSWRImmutable from 'swr/immutable'
import { fetchLimitlessSprites } from "./sprites.utils"
import { USE_LIMITLESS_SPRITES_KEY } from './sprites.constants'

export const useLimitlessSprites = () => {
  const { data, error, isLoading } = useSWRImmutable(USE_LIMITLESS_SPRITES_KEY, fetchLimitlessSprites)

  return {
    data,
    error,
    isLoading
  }
} 