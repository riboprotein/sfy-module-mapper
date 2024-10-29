import hashData from "../assets/sfy/hash.json";
import itemData from "../assets/sfy/data.json";

export const validItems = hashData.items;

export const getItemIcon = (itemId: string) => {
  const icon = itemData.icons.find((i) => i.id === itemId);
  return icon ? { position: icon.position, color: icon.color } : null;
};

export const getItemName = (itemId: string) => {
  const item = itemData.items.find((i) => i.id === itemId);
  return item ? item.name : itemId;
};
