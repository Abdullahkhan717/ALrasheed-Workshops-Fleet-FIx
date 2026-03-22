import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const translateText = async (text: string): Promise<string> => {
  if (!text) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to English. If it is already in English, translate it to Arabic. Only return the translated text: "${text}"`,
    });
    
    return response.text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};
