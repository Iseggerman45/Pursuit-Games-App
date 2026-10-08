// Vercel serverless endpoint for secure OpenAI game generation.
// Keep OPENAI_API_KEY in Vercel Environment Variables; never expose it to the browser.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to generate a game.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OpenAI is not configured yet. Add OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const manualTags = Array.isArray(req.body?.manualTags)
    ? req.body.manualTags.filter((tag: unknown) => typeof tag === 'string').slice(0, 30)
    : [];

  if (!prompt) return res.status(400).json({ error: 'Describe the game you want to create first.' });
  if (prompt.length > 4000) return res.status(400).json({ error: 'Please keep the game description under 4,000 characters.' });

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      setup: { type: 'string' },
      gameplay: { type: 'string' },
      hasWinner: { type: 'boolean' },
      howToWin: { type: 'string' },
      materials: { type: 'string' },
      duration: { type: 'string' },
      minPlayers: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      category: { type: 'string' },
    },
    required: ['title', 'setup', 'gameplay', 'hasWinner', 'howToWin', 'materials', 'duration', 'minPlayers', 'tags', 'category'],
  };

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        instructions: [
          'You create practical, creative, safe games for church youth groups, middle-school students, high-school students, and college students.',
          'The user may give the name of an existing game or a rough idea. Generate a complete playable version that fits their request and audience.',
          'Return detailed, clear, leader-ready instructions in Setup and Gameplay. Use numbered steps or short paragraphs inside the strings when helpful.',
          'Be realistic about materials, player counts, duration, indoor/outdoor needs, and safety. Avoid dangerous challenges, humiliation, or exclusion.',
          'Not every game needs a winner. For silly icebreakers, mixers, cooperative challenges, and just-for-fun activities, set hasWinner=false and explain in howToWin that there is no winner and how to wrap up the activity naturally.',
          'For competitive games, set hasWinner=true and clearly explain the end condition and exactly how the winner is determined.',
          'The howToWin field must always be filled in, even when hasWinner is false. Do not force a winner into a game that is designed just for fun.',
          'Materials should be a readable bullet list. Tags should be short and useful.',
          'Do not claim a game is a traditional or established game if you are inventing a variation.',
        ].join(' '),
        input: `Create a complete youth-group game from this request:\n\n${prompt}\n\nThe user selected these optional tags: ${manualTags.join(', ') || 'none'}.`,
        text: {
          format: {
            type: 'json_schema',
            name: 'pursuit_game',
            strict: true,
            schema,
          },
        },
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      const upstreamMessage = data?.error?.message;
      console.error('OpenAI game generation request failed:', upstream.status, upstreamMessage || 'No provider message');
      if (upstream.status === 401) {
        return res.status(502).json({ error: 'OpenAI rejected the API key. Check OPENAI_API_KEY in Vercel and redeploy.' });
      }
      if (upstream.status === 429) {
        return res.status(502).json({ error: 'OpenAI usage limit reached. Check API billing and usage limits in your OpenAI platform account.' });
      }
      return res.status(502).json({ error: 'OpenAI could not generate the game right now. Check the Vercel function logs for details, then try again.' });
    }

    const outputText = (data.output || [])
      .flatMap((item: any) => item.content || [])
      .find((item: any) => item.type === 'output_text')?.text;

    if (!outputText) {
      console.error('OpenAI response contained no output text.');
      return res.status(502).json({ error: 'The AI returned an empty response. Please try again.' });
    }

    const game = JSON.parse(outputText);
    if (!game.title || !game.setup || !game.gameplay || !game.howToWin) {
      return res.status(502).json({ error: 'The AI response was missing required game instructions. Please try again.' });
    }

    game.tags = Array.from(new Set([...(game.tags || []), ...manualTags]));
    game.rules = `## Setup\n${game.setup}\n\n## Gameplay\n${game.gameplay}\n\n## How to Win\n${game.howToWin}`;
    return res.status(200).json({ game });
  } catch (error) {
    console.error('Game generation endpoint error:', error);
    return res.status(500).json({ error: 'Something went wrong while generating the game. Please try again.' });
  }
}
