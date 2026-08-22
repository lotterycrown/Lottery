const requiredEnv = [
  'VITE_API_URL',
  'VITE_CLIENT_URL',
  'VITE_TELEGRAM_BOT_USERNAME',
  'VITE_MINI_APP_NAME',
] as const

const missingVars = requiredEnv.filter((envVar) => !import.meta.env[envVar])

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
}

export const config = {
  nodeEnv: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL as string,
  clientUrl: import.meta.env.VITE_CLIENT_URL as string,
  telegramBotUsername: import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string,
  miniAppName: import.meta.env.VITE_MINI_APP_NAME as string,
}
