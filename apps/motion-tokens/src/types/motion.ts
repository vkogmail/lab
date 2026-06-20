export type EasingArray = [number, number, number, number]

export interface TokenValues {
  duration: Record<string, number>
  easing: Record<string, number[]>
  translate: Record<string, number>
  scale: Record<string, number>
  rotate: Record<string, number>
}

export interface MotionVariant {
  entrance: {
    duration: number
    ease: number[]
    delay: number
    initial: {
      opacity: number
      translate?: number
      scale?: number
      rotate?: number
    }
    animate: {
      opacity: number
      translate?: number
      scale?: number
      rotate?: number
    }
  }
  hover: {
    duration: number
    ease: number[]
    scale?: number
    rotate?: number
  }
}

interface TokenValue {
  value: string | Record<string, string>
  type: string
  description: string
}

interface CoreTokens {
  [key: string]: TokenValue
}

interface TokenComponents {
  'card-enter': TokenValue
  'card-hover': TokenValue
  [key: string]: TokenValue
}

interface TokenVariant {
  patterns: Record<string, TokenValue>
  components: TokenComponents
}

export interface MotionTokens {
  core: CoreTokens
  teacher: TokenVariant
  pupil: TokenVariant
  [key: string]: CoreTokens | TokenVariant
}

export type TokenCategory = keyof TokenValues 