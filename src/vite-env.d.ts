/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
