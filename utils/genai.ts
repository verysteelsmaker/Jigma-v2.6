import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedGraphData } from "../types";

// We now accept the API key as an argument to allow BYOK (Bring Your Own Key) via the UI
// falling back to process.env if available, though UI input takes precedence.
const getClient = (apiKey?: string) => {
    const key = apiKey || process.env.API_KEY;
    if (!key) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey: key });
};

export const generateNodeComment = async (context: string, value: string, apiKey: string): Promise<string> => {
    try {
        if (!apiKey) throw new Error("Missing API Key");
        
        const ai = getClient(apiKey);
        const prompt = `Generate a short, concise, single-sentence description or fact about: ${value}. Context type: ${context}. Keep it under 20 words.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        
        return response.text || "No comment generated.";
    } catch (error) {
        console.error("AI Generation Error:", error);
        return "Error generating comment (Check API Key).";
    }
};

export const generateNodeImage = async (value: string, apiKey: string): Promise<string | null> => {
    try {
        if (!apiKey) throw new Error("Missing API Key");

        const ai = getClient(apiKey);
        // Using gemini-2.5-flash-image as requested for standard generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `A simple, flat vector icon or illustration representing: ${value}. Minimalist style.` }]
            }
        });

        // Iterate to find the image part
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("AI Image Error:", error);
        return null;
    }
};

export const analyzeTextToGraph = async (text: string, language: string, apiKey: string): Promise<GeneratedGraphData | null> => {
    try {
        if (!apiKey) throw new Error("Missing API Key");

        const ai = getClient(apiKey);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the following text and generate a knowledge graph structure. 
            Identify key entities (nodes) and their relationships (edges).
            Nodes should have a label, a type (use 'custom' or specific types like 'person', 'email', 'website' if applicable), a short value/description, and a color (hex code).
            Edges should have a source node ID, a target node ID, and a label describing the relationship.
            Text to analyze: "${text}"
            Language: ${language}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        nodes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    label: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    value: { type: Type.STRING },
                                    color: { type: Type.STRING },
                                },
                                required: ['id', 'label', 'type', 'value', 'color'],
                            },
                        },
                        edges: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    source: { type: Type.STRING },
                                    target: { type: Type.STRING },
                                    label: { type: Type.STRING },
                                },
                                required: ['source', 'target'],
                            },
                        },
                    },
                    required: ['nodes', 'edges'],
                }
            }
        });

        if (response.text) {
             return JSON.parse(response.text) as GeneratedGraphData;
        }
        return null;

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return null;
    }
};