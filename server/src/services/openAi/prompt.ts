import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

const openai = new OpenAI({});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';


export const getChatCompletion = async (prompt: string, systemMessage: string = 'You are a helpful and concise assistant.'): Promise<string> => {
  if (!prompt) {
    throw new Error("Prompt cannot be empty.");
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    
    if (content === null || content === undefined) {
      return "I received an empty response from the AI.";
    }
    return content.trim();
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to communicate with the OpenAI API.");
  }
};