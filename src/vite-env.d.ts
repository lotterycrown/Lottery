/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOT_USERNAME?: string;
  readonly VITE_MINI_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
