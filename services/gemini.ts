
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Game } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAiInstance = () => {
    if (!aiInstance) {
        aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return aiInstance;
}

export const generateGame = async (prompt: string, manualTags: string[] = []): Promise<Omit<Game, 'id' | 'rating'>> => {
    const ai = getAiInstance();
    
    // Define the expected JSON structure for a game
    const gameSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "The fun and catchy name of the game" },
            rules: { type: Type.STRING, description: "Clear, step-by-step rules and instructions on how to play. Use Markdown." },
            materials: { type: Type.STRING, description: "List of items needed to play" },
            duration: { type: Type.STRING, description: "Estimated time (e.g., '15 mins')" },
            tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Short descriptive tags (e.g., 'Indoor', 'Active', 'No Props')"
            }
        },
        required: ["title", "rules", "materials", "duration", "tags"],
    };

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a youth group game based on this description: "${prompt}". 
                   If the description is vague, come up with a popular, fun game.
                   Make the rules easy to understand for teenagers.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: gameSchema,
        }
    });

    if (!result.text) {
        throw new Error("Failed to generate game content");
    }

    const generatedGame = JSON.parse(result.text);

    // Merge manual tags with AI tags, ensuring uniqueness
    const mergedTags = Array.from(new Set([...(generatedGame.tags || []), ...manualTags]));

    return {
        ...generatedGame,
        tags: mergedTags
    };
};

export const improveGameText = async (currentText: string, instruction: string): Promise<string> => {
    const ai = getAiInstance();
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Original Text: "${currentText}"\n\nInstruction: Rewrite the text above to ${instruction}. Keep formatting (Markdown) if present.`,
    });

    return result.text || currentText;
};

export const generateGameContent = async (gameTitle: string, request: string): Promise<string> => {
    const ai = getAiInstance();
    
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context: A youth group game called "${gameTitle}".\nRequest: ${request}.\n\nProvide the output in clear Markdown format (lists, tables, etc).`,
    });

    return result.text || "Could not generate content.";
};
