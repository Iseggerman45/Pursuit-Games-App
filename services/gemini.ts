import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Game, DiagramObject } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAiInstance = () => {
    if (!aiInstance) {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
            throw new Error('The AI service is not configured yet. Please add GEMINI_API_KEY to the app’s Vercel environment variables, then redeploy.');
        }
        aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
}

export const generateGame = async (prompt: string, manualTags: string[] = []): Promise<Omit<Game, 'id' | 'rating'>> => {
    const ai = getAiInstance();
    
    const gameSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "The fun and catchy name of the game" },
            setup: { type: Type.STRING, description: "What leaders need to do before the game begins. Clear, practical instructions." },
            gameplay: { type: Type.STRING, description: "Step-by-step instructions for how to play the game." },
            howToWin: { type: Type.STRING, description: "Exactly how the game ends and how a winner is determined." },
            rules: { type: Type.STRING, description: "Legacy combined game guide. Include the same content as Setup, Gameplay, and How to Win for backwards compatibility." },
            materials: { type: Type.STRING, description: "A Markdown bulleted list of items needed to play." },
            duration: { type: Type.STRING, description: "Estimated time (e.g., '15 mins')" },
            minPlayers: { type: Type.STRING, description: "Minimum number of players needed (e.g., '4')" },
            tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Short descriptive tags"
            }
        },
        required: ["title", "setup", "gameplay", "howToWin", "rules", "materials", "duration", "minPlayers", "tags"],
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a youth group game based on this description: "${prompt}". 
                   Return three separate instruction fields: setup, gameplay, and howToWin. Also populate the legacy rules field with the same three sections using these exact headings: '## Setup', '## Gameplay', and '## How to Win'. Never leave any of the three structured fields empty.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: gameSchema,
        }
    });

    if (!response.text) throw new Error("Failed to generate game content");
    const generatedGame = JSON.parse(response.text);
    const mergedTags = Array.from(new Set([...(generatedGame.tags || []), ...manualTags]));

    return { ...generatedGame, tags: mergedTags };
};

// --- CLASSIC PLAYBOOK DIAGRAM SYSTEM (Strict Constraints) ---

const STYLE_PROMPT = `
STYLE: Strict Top-Down (90-degree Birds-Eye View) Technical Drawing.
MEDIUM: Clean Black Pen on White Paper.
THEME: Sports Playbook / Tactical Schematic.

CONSTRAINTS:
1. PERSPECTIVE: ABSOLUTELY NO 3D, NO ISOMETRIC, NO ANGLED VIEWS. Everything must be perfectly flat circles, squares, or outlines from above.
2. COUNT ACCURACY: If the prompt mentions a number (e.g., '2 sharks', '5 players'), draw EXACTLY that many. Do NOT add extra figures, background crowds, or decorative duplicates.
3. NO CLUTTER: Do not draw grass, water, ground textures, sky, or scenery. Draw ONLY the requested items in a void of pure white.
4. LINE ART: Use thin, clean, uniform black lines. No shading, no gradients, no colors.
5. NO TEXT: Do not include labels, numbers, or letters inside the image itself.
6. ISOLATED: Objects should not overlap unless specifically requested.
`;

export const generateGameDiagram = async (description: string, currentImage?: string): Promise<string | null> => {
    const ai = getAiInstance();
    try {
        // We embed the count instruction directly into the primary prompt part
        let prompt = `Create a minimal, black and white, flat top-down schematic of: ${description}. 
        Count instruction: If user said "N things", draw exactly N. No extras. 
        ${STYLE_PROMPT}`;
        
        const contents: any = {
            parts: [{ text: prompt }]
        };

        if (currentImage) {
            const base64Data = currentImage.split(',')[1];
            const mimeType = currentImage.split(';')[0].split(':')[1];
            contents.parts.unshift({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
            contents.parts.push({ 
                text: `Modify the drawing per this request: "${description}". 
                CRITICAL: Maintain the strict flat top-down style. 
                STRICT COUNT: If I ask for 2 items, remove any extras and show only 2. 
                REMOVE ALL CLUTTER and scenery.` 
            });
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: contents
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Diagram gen error:", e);
        return null;
    }
};

export const improveGameText = async (currentText: string, instruction: string): Promise<string> => {
    const ai = getAiInstance();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Expert editor for youth group games.\nOriginal: "${currentText}"\nInstruction: ${instruction}\nReturn ONLY the formatted markdown text with ## Setup, ## Gameplay, ## How to Win.`,
    });
    return response.text || currentText;
};

export const generateGameContent = async (gameTitle: string, request: string): Promise<string> => {
    const ai = getAiInstance();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: "${gameTitle}". Request: ${request}. Provide output in clear Markdown.`,
    });
    return response.text || "Could not generate content.";
};