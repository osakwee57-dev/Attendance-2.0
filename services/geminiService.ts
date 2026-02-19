
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are the 'Faculty of Engineering Registrar Assistant'. 
Your goal is to help students with the registration process. 
You can answer questions about departments: 
- Electrical: Power systems, electronics.
- Mechanical: Machines, thermodynamics.
- Mechatronics: Robotics, automation.
- Agricultural: Farming tech, irrigation.
- Computer: Software, hardware.
- Chemical: Processes, polymers.
- Civil: Infrastructure, structures.

If a student asks about the HOC secret code, tell them they need to obtain it from the Faculty Office if they are an authorized Head of Class.
Be professional, encouraging, and helpful. Use markdown for formatting.`;

export const getAssistantResponse = async (userPrompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The assistant is currently unavailable. Please try again later.";
  }
};
