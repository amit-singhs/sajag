/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Render API origin, e.g. https://sajag-api.onrender.com — leave empty locally to use the Vite proxy. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
