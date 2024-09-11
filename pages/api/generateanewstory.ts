import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { tellingStoryPrompt } from "@/prompts/prompts";

type Input = {
  answer: string;
  topK?: number;
  temperature: number;
  topP: number;
};

type Output = {
  error?: string;
  payload?: {
    story: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Output>
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { answer, temperature, topP }: Input = req.body;
  // console.log(answer);
  // console.log(temperature);
  // console.log(topP);

  try {
    const characters = JSON.parse(answer);
    const charactersList = characters.characters.map((char: any) => 
      `${char.name}: ${char.description}, ${char.personality}`
    ).join('\n');

    const prompt = tellingStoryPrompt(charactersList);
    // console.log(prompt);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: temperature,
      top_p: topP,
    });

    const story = response.choices[0].message.content || 'Unable to generate story';
    // console.log(story);

    res.status(200).json({ payload: { story } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `An error occurred while generating the story: ${errorMessage}` });
  }
}
