import { GoogleGenAI, Modality, Type } from "@google/genai";
import { MODEL_CHAT_REASONING, MODEL_FAST_SEARCH, MODEL_TTS, SYSTEM_INSTRUCTION, MODEL_TRANSCRIPTION } from "../constants";
import { Attachment } from "../types";

// Initialize API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a message to Gemini.
 */
export const sendMessageToGemini = async (
  text: string,
  attachments: Attachment[],
  useSearch: boolean = false
) => {
  try {
    const hasMedia = attachments.length > 0;
    
    // Choose model
    let modelName = useSearch ? MODEL_FAST_SEARCH : MODEL_CHAT_REASONING;
    if (hasMedia) {
        modelName = MODEL_CHAT_REASONING; 
    }

    const parts: any[] = [];
    
    if (text) {
      parts.push({ text });
    }

    attachments.forEach(att => {
        parts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.data
            }
        });
    });

    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
    };

    if (useSearch && modelName === MODEL_FAST_SEARCH) {
       config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });

    const responseText = response.text || "Não consegui gerar uma resposta técnica no momento.";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls = groundingChunks 
        ? groundingChunks
            .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
            .filter(Boolean)
        : [];

    return {
      text: responseText,
      groundingUrls: urls
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Erro ao consultar o ZapPRO. Verifique sua conexão.");
  }
};

/**
 * Transcribes audio input using gemini-2.5-flash
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_TRANSCRIPTION,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Audio } },
                    { text: `
                      ATENÇÃO: Transcreva EXATAMENTE o que foi dito neste áudio em Português do Brasil.
                      REGRAS CRÍTICAS DE SEGURANÇA:
                      1. Se o áudio estiver mudo, tiver apenas ruído, estalos ou silêncio: RETORNE UMA STRING VAZIA ("").
                      2. NÃO INVENTE CONTEÚDO.
                      3. Se não houver voz humana inteligível, o retorno DEVE ser vazio.
                    `}
                ]
            },
            config: {
                temperature: 0,
            }
        });
        
        return response.text ? response.text.trim() : "";
    } catch (error) {
        console.error("Transcription error", error);
        return "";
    }
}

/**
 * Generates Speech from text using gemini-2.5-flash-preview-tts
 * Returns RAW BASE64 string.
 */
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    if (!text || text.length < 2) return null;

    // Clean markdown for better speech (remove asterisks, hashes, links)
    // This regex cleaning is crucial for "WhatsApp like" audio messages that sound natural
    const cleanText = text
        .replace(/\*\*/g, '')        // Remove bold marks
        .replace(/\*/g, '')          // Remove list bullets
        .replace(/#/g, '')           // Remove header marks
        .replace(/\[.*?\]/g, '')     // Remove markdown link text
        .replace(/\(.*?\)/g, '')     // Remove markdown link url
        .replace(/`/g, '')           // Remove code ticks
        .replace(/⚠️/g, 'Atenção: ') // Translate emoji to text
        .replace(/🛠️/g, '')
        .replace(/❄️/g, '');

    // Increase limit to 4000 chars (approx 4-5 mins of speech)
    // This ensures long technical explanations are fully read
    let limit = 4000; 
    let speakableText = cleanText.slice(0, limit);
    
    // Smart cut: If text exceeds limit, cut at the last punctuation
    if (cleanText.length > limit) {
        const lastPunctuation = Math.max(
            speakableText.lastIndexOf('.'), 
            speakableText.lastIndexOf('!'), 
            speakableText.lastIndexOf('?'),
            speakableText.lastIndexOf('\n')
        );
        if (lastPunctuation > 0) { 
            speakableText = speakableText.slice(0, lastPunctuation + 1);
        }
    }

    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text: speakableText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is deeper, more masculine, good for "technician" persona
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
