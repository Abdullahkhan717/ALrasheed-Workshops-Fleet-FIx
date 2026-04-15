let counter = 0;
export const generateId = () => {
  counter++;
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10) + counter.toString(36);
};
