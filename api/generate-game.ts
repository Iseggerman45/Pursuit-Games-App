import { GoogleGenAI, Type } from '@google/genai';

// Vercel serverless endpoint for secure Gemini game generation.
// Keep GEMINI_API_KEY in Vercel Environment Variables; never expose it to the browser.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to generate a game.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Gemini is not configured yet. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const manualTags = Array.isArray(req.body?.manualTags)
    ? req.body.manualTags.filter((tag: unknown) => typeof tag === 'string').slice(0, 30)
    : [];

  if (!prompt) return res.status(400).json({ error: 'Describe the game you want to create first.' });
  if (prompt.length > 4000) return res.status(400).json({ error: 'Please keep the game description under 4,000 characters.' });

  const ai = new GoogleGenAI({ apiKey });
  const gameSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'A fun and catchy name for the game.' },
      setup: { type: Type.STRING, description: 'Clear, practical instructions for preparing the game.' },
      gameplay: { type: Type.STRING, description: 'Clear step-by-step instructions for playing.' },
      hasWinner: { type: Type.BOOLEAN, description: 'True only when the game has a winner; false for cooperative or just-for-fun games.' },
      howToWin: { type: Type.STRING, description: 'How the game ends and how a winner is determined, or how to wrap up if there is no winner.' },
      materials: { type: Type.STRING, description: 'A readable Markdown bullet list of materials.' },
      duration: { type: Type.STRING, description: 'Estimated duration, such as 15 minutes.' },
      minPlayers: { type: Type.STRING, description: 'Minimum number of players.' },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Short useful descriptive tags.' },
      category: { type: Type.STRING, description: 'A short game category.' },
    },
    required: ['title', 'setup', 'gameplay', 'hasWinner', 'howToWin', 'materials', 'duration', 'minPlayers', 'tags', 'category'],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        'Create a practical, creative, safe game for a church youth group, including middle-school, high-school, and college students.',
        'The user may provide an existing game name or a rough idea. Create a complete playable version that fits the request and selected audience.',
        'Give detailed, leader-ready setup and gameplay instructions. Be realistic about player counts, duration, materials, and indoor/outdoor needs. Avoid dangerous challenges, humiliation, and exclusion.',
        'Not every game needs a winner. For silly icebreakers, mixers, cooperative challenges, and just-for-fun activities, set hasWinner to false and explain a natural wrap-up in howToWin. Do not force a winner into these games.',
        'For competitive games, set hasWinner to true and explain the end condition and exactly how the winner is determined. Always fill every field.',
        'Do not claim an invented variation is a traditional version of a game.',
        `User request: ${prompt}`,
        `Optional tags selected by the user: ${manualTags.join(', ') || 'none'}.`,
      ].join('\n\n'),
      config: {
        responseMimeType: 'application/json',
        responseSchema: gameSchema,
      },
    });

    if (!response.text) {
      return res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
    }

    const game = JSON.parse(response.text);
    if (!game.title || !game.setup || !game.gameplay || !game.howToWin) {
      return res.status(502).json({ error: 'Gemini did not return all required game instructions. Please try again.' });
    }

    game.tags = Array.from(new Set([...(Array.isArray(game.tags) ? game.tags : []), ...manualTags]));
    game.category = game.category || 'General';
    game.rules = `## Setup\n${game.setup}\n\n## Gameplay\n${game.gameplay}\n\n## How to Win\n${game.howToWin}`;
    return res.status(200).json({ game });
  } catch (error: any) {
    console.error('Gemini game generation request failed:', error?.message || error);
    const message = String(error?.message || '');
    if (/api.?key|unauthorized|permission denied|403|401/i.test(message)) {
      return res.status(502).json({ error: 'Gemini rejected the API key. Check GEMINI_API_KEY in Vercel and redeploy.' });
    }
    if (/quota|rate.?limit|resource.?exhausted|429/i.test(message)) {
      return res.status(502).json({ error: 'Gemini usage limit reached. Check your Google AI Studio API quota and billing settings.' });
    }
    return res.status(502).json({ error: 'Gemini could not generate the game right now. Check the Vercel function logs for details, then try again.' });
  }
}
