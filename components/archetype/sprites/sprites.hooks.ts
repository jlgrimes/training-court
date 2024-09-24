import useSWRImmutable from 'swr/immutable'
import { fetchLimitlessSprites } from "./sprites.utils"

export const useLimitlessSprites = () => {
  const { data, error, isLoading } = useSWRImmutable('limitless-sprites', fetchLimitlessSprites)

  return {
    data,
    error,
    isLoading
  }
} 