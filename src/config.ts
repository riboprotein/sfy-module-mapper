// src/config.ts
const config = {
  apiKey: import.meta.env.VITE_JSONBIN_API_KEY || "",
};

// Basic encoding to make the values less obvious in the build
export const getConfig = () => ({
  apiKey: btoa(config.apiKey),
});
