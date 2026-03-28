const GROQ_KEY = process.env.REACT_APP_GROQ_KEY;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const callGroq = async (messages, maxTokens = 1200, retries = 3) => {
  if (!GROQ_KEY || GROQ_KEY === 'undefined') {
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
          model: 'llama3-70b-8192',
          messages,
          temperature: 0.85,
          max_tokens: maxTokens,
        })
      });

      if (response.status === 429) {
        console.log(`Rate limited, waiting ${3000 * (attempt+1)}ms...`);
        await sleep(3000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`API error: ${response.status} - ${JSON.stringify(err)}`);
      }

      const data = await response.json();
      if (!data.choices?.[0]) throw new Error('Invalid response');
      return data.choices[0].message.content;

    } catch(error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === retries - 1) throw error;
      await sleep(2000);
    }
  }
};