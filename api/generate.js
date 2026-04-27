export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { idea, styles, imgOpts, ratio, lang, type } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'الفكرة مطلوبة' });
  }

  const langInstruction = lang === 'en'
    ? 'Write the prompt in English only.'
    : 'اكتب البرومبت باللغة العربية فقط.';

  let systemPrompt, userMsg;

  if (type === 'tips') {
    systemPrompt = 'You are a prompt enhancement assistant. Return ONLY a JSON array of 4 short Arabic suggestion strings (each max 4 words) that could improve this image prompt. No explanation, just the raw JSON array.';
    userMsg = idea;
  } else {
    systemPrompt = `You are an expert AI prompt engineer. Transform the user's rough idea into a professional, detailed image generation prompt.
Rules:
- ${langInstruction}
- Include: lighting, mood, colors, composition, camera angle, style
- Add technical quality tags: ultra-detailed, 8k, sharp focus, etc.
- ONE paragraph only, no bullet points
- Make it vivid and specific
- Aspect ratio ${ratio}: mention composition accordingly`;

    userMsg = `الفكرة: ${idea}
${styles?.length ? 'الأسلوب: ' + styles.join('، ') : ''}
${imgOpts?.length ? 'خيارات الصورة: ' + imgOpts.join('، ') : ''}
نسبة الأبعاد: ${ratio}`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('').trim();
    return res.status(200).json({ result: text });
  } catch (e) {
    return res.status(500).json({ error: 'AI request failed' });
  }
}
