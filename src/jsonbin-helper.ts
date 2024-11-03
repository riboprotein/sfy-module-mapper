// src/jsonbin-helper.ts
import { getConfig } from "./config";

export const createJSONBinHelper = () => {
  const BASE_URL = "https://api.jsonbin.io/v3";
  const { binId, apiKey } = getConfig();

  // Decode the values when using them
  const decodedBinId = atob(binId);
  const decodedApiKey = atob(apiKey);

  const saveData = async <T>(data: T) => {
    try {
      const response = await fetch(`${BASE_URL}/b/${decodedBinId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": decodedApiKey,
          "X-Bin-Versioning": "false",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error saving to JSONBin:", error);
      throw error;
    }
  };

  const getData = async <T>() => {
    try {
      const response = await fetch(`${BASE_URL}/b/${decodedBinId}/latest`, {
        headers: {
          "X-Master-Key": decodedApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();
      return jsonResponse.record as T;
    } catch (error) {
      console.error("Error retrieving from JSONBin:", error);
      throw error;
    }
  };

  return { saveData, getData };
};
