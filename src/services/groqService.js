const GROQ_KEY = process.env.REACT_APP_GROQ_KEY;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const callGroq = async (messages, maxTokens = 1400, retries = 3) => {
  if (!GROQ_KEY || GROQ_KEY === 'undefined') {
    console.error('❌ GROQ API key missing! Check .env for REACT_APP_GROQ_KEY');
    throw new Error('API key missing');
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) await sleep(3000 * attempt);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 1.1,   // higher = more varied, creative responses
          top_p: 0.95,         // keeps quality while allowing creativity
          max_tokens: maxTokens,
        })
      });

      if (response.status === 429) {
        console.warn(`⚠️ Rate limited (attempt ${attempt + 1}), waiting...`);
        await sleep(4000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('❌ Groq API error:', response.status, JSON.stringify(err));
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        console.error('❌ Empty response from Groq:', JSON.stringify(data));
        throw new Error('Empty response');
      }

      return data.choices[0].message.content;

    } catch(error) {
      console.error(`❌ Groq attempt ${attempt + 1} failed:`, error.message);
      if (attempt === retries - 1) throw error;
      await sleep(2000);
    }
  }
};