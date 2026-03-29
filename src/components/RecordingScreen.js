import { useState, useEffect, useRef } from 'react';
import { callGroq } from '../services/groqService';

const LANG_CONFIG = {
  en: {
    speechLang: 'en-IN',
    langInstruction: 'Write your entire response in English.',
    emotionLang: 'English',
    exampleEmotions: '["😊 Joyful", "🌸 Grateful", "✨ Light"]',
  },
  kn: {
    speechLang: 'kn-IN',
    langInstruction: 'Write your entire response in Kannada script.',
    emotionLang: 'Kannada',
    exampleEmotions: '["😊 ಸಂತೋಷ", "💙 ನೆಮ್ಮದಿ", "✨ ಬೆಳಕು"]',
  },
  hi: {
    speechLang: 'hi-IN',
    langInstruction: 'Write your entire response in Hindi (Devanagari script).',
    emotionLang: 'Hindi',
    exampleEmotions: '["😊 खुशी", "💙 राहत", "✨ उम्मीद"]',
  },
};

const RESPONSE_STYLES = [
  {
    persona: "a warm older didi (sister) who has been through it all and speaks from real experience",
    vibe: "gentle and grounding",
    structure: "Start by sitting with her feeling. Don't rush to fix anything. Then offer one gentle insight.",
  },
  {
    persona: "a best friend who just sat down with chai and is fully present — no judgment, just love",
    vibe: "casual, warm, real",
    structure: "React like a real friend first — with feeling. Then get honest and caring.",
  },
  {
    persona: "someone who notices what she DIDN'T say as much as what she did — quiet, observant, wise",
    vibe: "thoughtful and poetic",
    structure: "Name the unspoken feeling underneath her words. Then gently reflect it back.",
  },
  {
    persona: "someone who celebrates her even when she can't celebrate herself — sees her strength clearly",
    vibe: "affirming and honest",
    structure: "Point out something she's already doing right that she's probably not seeing. Then encourage.",
  },
  {
    persona: "a grounded friend who is direct but deeply caring — doesn't sugarcoat but always holds space",
    vibe: "direct and loving",
    structure: "Say the honest truth she needs to hear, wrapped in warmth. No fluff.",
  },
];

const OPENING_STYLES = [
  "Open by quoting her exact words back to her and responding emotionally to them.",
  "Open by naming the specific feeling underneath what she said — more precise than what she said herself.",
  "Open with a single short punchy sentence that speaks directly to her heart.",
  "Open with a warm, honest observation about what her words revealed.",
  "Open by acknowledging the emotion first before anything else — hold space before speaking.",
];

const FORMAT_STYLES = [
  `End with:
🎯 THIS WEEK:
✦ [one small specific action from her exact words]
✦ [one small specific action from her exact words]
✦ [one small specific action from her exact words]

💭 [one question that makes her think differently about her situation]`,
  `End with one thoughtful question that opens something up for her. No goal list this time.

💭 [one powerful unexpected question]`,
  `End with a short note of encouragement — no goals, no questions. Just leave her feeling held.`,
  `End with:
💭 [one question that gently challenges a belief she might be holding]

Then one small suggestion — just one, specific to what she said.`,
];

export default function RecordingScreen({
  setScreen, setTherapistResponse, setEmotions,
  addAudio, savedAudios,
  language = 'en',
}) {
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [audioURL, setAudioURL] = useState(null);

  const langCfg = LANG_CONFIG[language] || LANG_CONFIG.en;

  const promptsByLang = {
    en: [
      '"What\'s been weighing on your heart today?"',
      '"Tell me about a moment this week that surprised you…"',
      '"What do you wish someone had told you today?"',
      '"What emotion are you carrying right now?"',
      '"Is there something you haven\'t said out loud yet?"',
      '"What made you smile today, even a little?"',
    ],
    kn: [
      '"ಇಂದು ನಿಮ್ಮ ಮನಸ್ಸಿನ ಮೇಲೆ ಏನು ಭಾರವಾಗಿದೆ?"',
      '"ಈ ವಾರ ನಿಮ್ಮನ್ನು ಆಶ್ಚರ್ಯಗೊಳಿಸಿದ ಕ್ಷಣದ ಬಗ್ಗೆ ಹೇಳಿ…"',
      '"ಇಂದು ಯಾರಾದರೂ ನಿಮಗೆ ಏನು ಹೇಳಬೇಕಿತ್ತು ಎಂದು ಅನಿಸುತ್ತಿದೆ?"',
      '"ಈಗ ನೀವು ಯಾವ ಭಾವನೆಯನ್ನು ಹೊತ್ತಿದ್ದೀರಿ?"',
    ],
    hi: [
      '"आज आपके दिल पर क्या भारी है?"',
      '"इस हफ़्ते कोई ऐसा पल था जिसने आपको चौंका दिया?"',
      '"आज आप क्या सुनना चाहती थीं जो किसी ने नहीं कहा?"',
      '"अभी आप कौन सी भावना लिए चल रही हैं?"',
    ],
  };

  const prompts = promptsByLang[language] || promptsByLang.en;
  const [prompt] = useState(prompts[Math.floor(Math.random() * prompts.length)]);

  const styleRef = useRef({
    persona: RESPONSE_STYLES[Math.floor(Math.random() * RESPONSE_STYLES.length)],
    opening: OPENING_STYLES[Math.floor(Math.random() * OPENING_STYLES.length)],
    format: FORMAT_STYLES[Math.floor(Math.random() * FORMAT_STYLES.length)],
  });

  const loadingMsgsByLang = {
    en: ['Dhvani is reading your words...', 'Feeling what you felt...', 'Finding the right words for you...'],
    kn: ['ಧ್ವನಿ ನಿಮ್ಮ ಮಾತುಗಳನ್ನು ಓದುತ್ತಿದ್ದಾಳೆ...', 'ನಿಮ್ಮ ಭಾವನೆಗಳನ್ನು ಅನುಭವಿಸುತ್ತಿದ್ದಾಳೆ...'],
    hi: ['ध्वनि आपके शब्द पढ़ रही है...', 'आपकी भावना महसूस कर रही है...'],
  };
  const msgs = loadingMsgsByLang[language] || loadingMsgsByLang.en;

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = langCfg.speechLang;
      rec.onresult = (event) => {
        let interim = '';
        let final = finalTranscriptRef.current;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
            finalTranscriptRef.current = final;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(final + interim);
      };
      rec.start();
      recognitionRef.current = rec;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        audioChunksRef.current = [];
        mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioURL(URL.createObjectURL(blob));
          stream.getTracks().forEach(t => t.stop());
        };
        mr.start();
      })
      .catch(e => console.log('Mic error:', e));

    return () => {
      try { recognitionRef.current?.stop(); } catch(e) {}
      try { if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); } catch(e) {}
    };
  }, []); // eslint-disable-line

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const handleDone = async () => {
    try { recognitionRef.current?.stop(); } catch(e) {}
    try { if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); } catch(e) {}

    const cleanTranscript = finalTranscriptRef.current.trim() || transcript.trim();

    if (!cleanTranscript || cleanTranscript.length < 5) {
      const silenceFallbacks = {
        en: `Hey… I noticed you didn't say anything, and that's completely okay 💙\n\nSometimes the words just don't come, and silence can mean so many things. Maybe you're overwhelmed, maybe you just needed a moment to breathe. All of that is valid.\n\nWhenever you're ready — I'm here. No pressure, no judgment 🌸`,
        kn: `ಹೇ… ನೀವು ಏನೂ ಹೇಳಲಿಲ್ಲ, ಮತ್ತು ಅದು ಸಂಪೂರ್ಣವಾಗಿ ಸರಿ 💙\n\nಕೆಲವೊಮ್ಮೆ ಮಾತುಗಳು ಬರುವುದಿಲ್ಲ. ನೀವು ಸಿದ್ಧರಾದಾಗ, ನಾನು ಇಲ್ಲಿಯೇ ಇರುತ್ತೇನೆ 🌸`,
        hi: `हे… आपने कुछ नहीं कहा, और यह बिल्कुल ठीक है 💙\n\nकभी-कभी शब्द नहीं आते। जब तैयार हों — मैं यहाँ हूँ 🌸`,
      };
      setTherapistResponse(silenceFallbacks[language] || silenceFallbacks.en);
      setEmotions(['💙 Processing', '🌿 Stillness', '✨ Courage']);
      setScreen('summary');
      return;
    }

    setLoading(true);
    setLoadingMsg(msgs[0]);

    const pastEntries = savedAudios.slice(0, 3).map((a, i) =>
      `Entry ${i + 1} (${a.date}): "${a.transcript?.slice(0, 120)}"`
    ).join('\n');

    const { persona, opening, format } = styleRef.current;

    try {
      const msgInterval = setInterval(() => {
        setLoadingMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      }, 2500);

      const rawOutput = await callGroq([
        {
          role: 'system',
          content: `You are Dhvani — an emotionally intelligent listener and companion for young Indian women.

TODAY you are speaking as: ${persona.persona}
Your vibe today: ${persona.vibe}
How to structure your response: ${persona.structure}
How to open: ${opening}

LANGUAGE: ${langCfg.langInstruction}

YOUR MOST IMPORTANT JOB — EMOTION MIRRORING:
Read her words carefully and respond to the emotion she ACTUALLY expressed.
- If she says she's HAPPY → celebrate with her genuinely. Match her joy. Don't project sadness or suggest something is hidden.
- If she says she's SAD → sit with her in it. Don't rush to fix.
- If she's STRESSED or OVERWHELMED → validate the weight, then gently ground her.
- If she's ANGRY → validate the anger first, then explore it.
- If she's CONFUSED → meet her in the confusion, don't pretend to have easy answers.
- If she's EXCITED → match her energy and amplify it.
- If she's GRATEFUL or PEACEFUL → honour that feeling, don't complicate it.
CRITICAL: Do NOT override her emotion with a different one. If she's happy, respond happily.

HOW TO WRITE:
- Sound like a real human, not a self-help book or therapist template
- Use her exact words — quote them
- Vary sentence lengths naturally
- Never start with: "I hear you", "It sounds like", "Thank you for sharing", "I can sense", "I can feel"
- Minimum 6 sentences

${format}

THEN on a new line, add exactly:
EMOTIONS_JSON: [3 emotion strings with emoji in ${langCfg.emotionLang} that match HER actual feeling — e.g. ${langCfg.exampleEmotions}]

The emotions MUST reflect what she actually said, not generic defaults.`,
        },
        {
          role: 'user',
          content: `${pastEntries ? `Her past entries for context:\n${pastEntries}\n\n` : ''}What she said just now:
"${cleanTranscript}"

Respond as Dhvani. First read her actual emotion from her words — then respond to THAT emotion specifically.`,
        }
      ], 1400);

      clearInterval(msgInterval);

      let aiResponse = rawOutput.trim();
      let detectedEmotions = ['💙 Heard', '🌸 Supported', '✨ Growing'];

      const emotionMatch = rawOutput.match(/EMOTIONS_JSON:\s*(\[[\s\S]*?\])/);
      if (emotionMatch) {
        try {
          const parsed = JSON.parse(emotionMatch[1]);
          if (Array.isArray(parsed) && parsed.length > 0) detectedEmotions = parsed;
        } catch(e) {}
        aiResponse = rawOutput.replace(/EMOTIONS_JSON:[\s\S]*$/, '').trim();
      }

      await sleep(400);

      const newAudio = {
        id: Date.now(),
        transcript: cleanTranscript,
        response: aiResponse,
        emotions: detectedEmotions,
        audioURL,
        language,
        date: new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        duration: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
      };

      addAudio(newAudio);
      setTherapistResponse(aiResponse);
      setEmotions(detectedEmotions);
      setLoading(false);
      setScreen('summary');

    } catch (error) {
      console.error('Groq error:', error);

      // Smart fallback — detect emotion from keywords first
      const lower = cleanTranscript.toLowerCase();

      const isHappy = /happy|great|excited|good|wonderful|amazing|joy|love|thrilled|glad|yay|awesome|fantastic|elated|content|blessed|celebrate/.test(lower)
        || /ಸಂತೋಷ|ಖುಷಿ|ಚೆನ್ನಾಗಿ|ಆನಂದ/.test(lower)
        || /खुश|अच्छा|खुशी|मज़ा|बढ़िया/.test(lower);

      const isSad = /sad|cry|depressed|alone|lonely|hopeless|miss|grief|lost|broken|hurt|empty|numb/.test(lower)
        || /ದುಃಖ|ಅಳು|ಒಂಟಿ|ನೋವು/.test(lower)
        || /दुखी|रोना|अकेल|दर्द/.test(lower);

      const isStressed = /stress|anxious|overwhelm|pressure|tired|exhaust|worried|panic|scared|burden|too much/.test(lower)
        || /ಒತ್ತಡ|ಆತಂಕ|ದಣಿ|ಭಯ/.test(lower)
        || /तनाव|थकी|परेशान|डर/.test(lower);

      const isAngry = /angry|frustrated|annoyed|unfair|hate|mad|irritated|furious|rage/.test(lower)
        || /ಕೋಪ|ಸಿಟ್ಟು|ಅನ್ಯಾಯ/.test(lower)
        || /गुस्सा|नाराज|गलत/.test(lower);

      // Fallback pools — emotion-matched, multiple options for variety
      const pools = {
        happy: {
          en: [
            `"${cleanTranscript.slice(0, 55)}..." — okay this genuinely made me smile 😊 There's something beautiful about a moment of happiness you actually stop and notice. Hold onto this — it's real and it's yours.\n\n💭 What made today feel different from other days?`,
            `You said you're happy and I just want to say — yes. Celebrate that! You don't need a reason or permission to feel good. This moment matters.\n\n💭 What would it look like to carry a little of this feeling into tomorrow?`,
            `"${cleanTranscript.slice(0, 55)}..." — can we just sit here for a second and appreciate this? 🌸 Happiness deserves to be acknowledged just as much as the hard stuff. You're glowing and I see it.\n\n💭 Who in your life would you want to share this feeling with?`,
          ],
          kn: [
            `"${cleanTranscript.slice(0, 55)}..." — ಇದು ಓದಿ ನನಗೂ ಸಂತೋಷವಾಯಿತು 😊 ಈ ಖುಷಿಯನ್ನು ಆನಂದಿಸಿ — ಅದು ನಿಮ್ಮದೇ.\n\n💭 ಇಂದು ಯಾವ ಕ್ಷಣ ನಿಮ್ಮನ್ನು ಹೆಚ್ಚು ಸಂತೋಷಪಡಿಸಿತು?`,
            `ನೀವು ಖುಷಿಯಾಗಿದ್ದೀರಿ — ಅದು ತುಂಬಾ ಸುಂದರ 🌸 ಈ ಭಾವನೆಯನ್ನು ಪೂರ್ಣವಾಗಿ ಆನಂದಿಸಿ.\n\n💭 ಈ ಸಂತೋಷವನ್ನು ಯಾರೊಂದಿಗಾದರೂ ಹಂಚಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಾ?`,
          ],
          hi: [
            `"${cleanTranscript.slice(0, 55)}..." — यह पढ़कर मुझे भी अच्छा लगा 😊 खुशी को celebrate करना ज़रूरी है। यह पल आपका है।\n\n💭 आज क्या हुआ जिसने आपको इतना अच्छा महसूस कराया?`,
            `आप खुश हैं — और यह बहुत खूबसूरत है 🌸 इस भावना को पूरी तरह महसूस करें।\n\n💭 इस खुशी को किसके साथ बाँटना चाहेंगी?`,
          ],
          emotions: { en: ['😊 Joyful', '🌸 Grateful', '✨ Light'], kn: ['😊 ಸಂತೋಷ', '🌸 ಕೃತಜ್ಞತೆ', '✨ ಬೆಳಕು'], hi: ['😊 खुशी', '🌸 कृतज्ञता', '✨ उजाला'] },
        },
        sad: {
          en: [
            `"${cleanTranscript.slice(0, 55)}..." — that heaviness is real, and you don't have to explain or justify it. Sometimes things just hurt. I'm here.\n\n💭 Is there one small thing that might make today feel even slightly lighter?`,
            `You're carrying something heavy right now, na. I can feel it in your words. You don't have to be okay. You just have to keep breathing.\n\n💭 What would it feel like to put this down, even just for an hour?`,
          ],
          kn: [`"${cleanTranscript.slice(0, 55)}..." — ಆ ಭಾರ ನಿಜ. ನೀವು ಅದನ್ನು ವಿವರಿಸಬೇಕಿಲ್ಲ. ನಾನು ಇಲ್ಲಿದ್ದೇನೆ.\n\n💭 ಇಂದು ಒಂದು ಚಿಕ್ಕ ಸಂಗತಿ ನಿಮ್ಮನ್ನು ಹಗುರಾಗಿಸಬಹುದೇ?`],
          hi: [`"${cleanTranscript.slice(0, 55)}..." — यह भारीपन सच्चा है। आपको इसे justify नहीं करना। मैं यहाँ हूँ।\n\n💭 क्या एक छोटी सी चीज़ है जो आज को थोड़ा हल्का कर सके?`],
          emotions: { en: ['💙 Sadness', '🌿 Stillness', '🌸 Acceptance'], kn: ['💙 ದುಃಖ', '🌿 ಮೌನ', '🌸 ಸ್ವೀಕಾರ'], hi: ['💙 दुखी', '🌿 शांति', '🌸 स्वीकृति'] },
        },
        stressed: {
          en: [
            `"${cleanTranscript.slice(0, 55)}..." — that kind of tired isn't just physical, is it? It's the kind that comes from holding too much for too long. You're allowed to set something down today.\n\n💭 What's one thing you could let go of — just for today?`,
            `The pressure you're feeling is real. And the fact that you're still showing up? That's not nothing. That's everything.\n\n💭 If you could change one thing about your current situation, what would it be?`,
          ],
          kn: [`"${cleanTranscript.slice(0, 55)}..." — ಆ ಆಯಾಸ ಕೇವಲ ದೇಹದ್ದಲ್ಲ. ಬಹಳ ಕಾಲ ಹೊತ್ತ ಭಾರ ಅದು. ಇಂದು ಒಂದು ಸಂಗತಿಯನ್ನು ಕೆಳಗೆ ಇಡಲು ಅನುಮತಿ ಇದೆ.\n\n💭 ಈಗ ಬಿಡಬಹುದಾದ ಒಂದು ಸಂಗತಿ ಯಾವುದು?`],
          hi: [`"${cleanTranscript.slice(0, 55)}..." — यह थकान सिर्फ शरीर की नहीं है। बहुत कुछ उठाए रखने की थकान है। आज एक चीज़ नीचे रखने की इजाज़त है।\n\n💭 अभी क्या एक चीज़ है जो आप छोड़ सकती हैं?`],
          emotions: { en: ['😓 Overwhelmed', '💪 Still Going', '🌿 Seeking Calm'], kn: ['😓 ಒತ್ತಡ', '💪 ಧೈರ್ಯ', '🌿 ನೆಮ್ಮದಿ'], hi: ['😓 तनाव', '💪 साहस', '🌿 राहत'] },
        },
        angry: {
          en: [`"${cleanTranscript.slice(0, 55)}..." — that frustration makes complete sense. Anger usually means something that mattered to you wasn't respected. Your feelings are valid.\n\n💭 What would it look like if this situation went the way you actually wanted?`],
          kn: [`"${cleanTranscript.slice(0, 55)}..." — ಆ ಕೋಪ ಸರಿಯಾಗಿದೆ. ನಿಮ್ಮ ಭಾವನೆಗಳು ನಿಜ.\n\n💭 ಈ ಪರಿಸ್ಥಿತಿ ನಿಮ್ಮ ಆಸೆಯಂತೆ ಇದ್ದಿದ್ದರೆ ಹೇಗಿರುತ್ತಿತ್ತು?`],
          hi: [`"${cleanTranscript.slice(0, 55)}..." — यह गुस्सा समझ में आता है। आपकी भावनाएं सच्ची हैं।\n\n💭 अगर यह situation आपकी मर्ज़ी से होती, तो कैसी होती?`],
          emotions: { en: ['😤 Frustrated', '💙 Seeking Justice', '🌿 Processing'], kn: ['😤 ಕೋಪ', '💙 ನ್ಯಾಯ', '🌿 ಸಮಾಧಾನ'], hi: ['😤 गुस्सा', '💙 न्याय', '🌿 शांति'] },
        },
        generic: {
          en: [
            `"${cleanTranscript.slice(0, 55)}..." — I'm so glad you said this out loud. Whatever you're feeling right now is real, and it deserves space. You deserve space.\n\n💭 What do you need most right now — and have you asked for it yet?`,
            `You showed up today and said something true. That matters more than you know.\n\n💭 What's one thing you wish someone understood about what you're going through?`,
          ],
          kn: [`"${cleanTranscript.slice(0, 55)}..." — ನೀವು ಇದನ್ನು ಮಾತಾಡಿದ್ದು ಮುಖ್ಯ. ನಿಮ್ಮ ಭಾವನೆಗಳಿಗೆ ಜಾಗ ಇದೆ.\n\n💭 ಈಗ ನಿಮಗೆ ಅತ್ಯಂತ ಅಗತ್ಯವಿರುವುದು ಏನು?`],
          hi: [`"${cleanTranscript.slice(0, 55)}..." — आपने यह बोला, यही काफी है। आपकी भावनाएं असली हैं।\n\n💭 अभी आपको सबसे ज़्यादा क्या चाहिए?`],
          emotions: { en: ['💙 Heard', '🌸 Seen', '✨ Growing'], kn: ['💙 ಕೇಳಿಸಿಕೊಂಡಿದ್ದಾರೆ', '🌸 ಅರ್ಥಮಾಡಿದ್ದಾರೆ', '✨ ಬೆಳೆಯುತ್ತಿದ್ದೇನೆ'], hi: ['💙 सुना गया', '🌸 देखा गया', '✨ बढ़ रही हूँ'] },
        },
      };

      const key = isHappy ? 'happy' : isSad ? 'sad' : isStressed ? 'stressed' : isAngry ? 'angry' : 'generic';
      const pool = pools[key];
      const langPool = pool[language] || pool.en;
      const fallback = langPool[Math.floor(Math.random() * langPool.length)];
      const emotions = pool.emotions[language] || pool.emotions.en;

      setTherapistResponse(fallback);
      setEmotions(emotions);
      addAudio({
        id: Date.now(),
        transcript: cleanTranscript,
        response: fallback,
        emotions,
        audioURL,
        language,
        date: new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        duration: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
      });
      setLoading(false);
      setScreen('summary');
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const langLabels = { en: '🇬🇧 English', kn: '🇮🇳 ಕನ್ನಡ', hi: '🇮🇳 हिन्दी' };

  if (loading) {
    return (
      <div className="screen" style={{ justifyContent: 'center', gap: 24 }}>
        <div style={{ fontSize: 64 }}>🌸</div>
        <div style={{ color: 'white', fontSize: 18, fontWeight: 300, textAlign: 'center', padding: '0 20px' }}>
          {loadingMsg}
        </div>
        <div className="loading-dots"><span></span><span></span><span></span></div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: '0 40px', lineHeight: 1.7 }}>
          Reading every word, understanding your heart...
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="rec-header">
        <div className="rec-label">● recording</div>
        <div className="rec-title">speak freely, no judgment</div>
        <div style={{
          display: 'inline-block', marginTop: 4,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(200,184,232,0.15)',
          border: '1px solid rgba(200,184,232,0.3)',
          color: '#c8b8e8', fontSize: 11,
        }}>
          {langLabels[language] || 'English'}
        </div>
      </div>
      <div className="waveform-wrap">
        {[20,35,50,40,60,45,55,30,48,38,60,28,42,58,34,50,22,44,56,32].map((h, i) => (
          <div key={i} className="wave-bar" style={{ height: h }}></div>
        ))}
      </div>
      <div className="timer-wrap">
        <div className="timer">{formatTime(seconds)}</div>
        <div className="timer-label">🎙️ listening...</div>
      </div>
      <div className="prompt-box">
        <div className="prompt-text" style={transcript.trim() ? { color: 'rgba(255,255,255,0.85)', fontStyle: 'normal', fontSize: '13px', lineHeight: '1.7' } : {}}>
          {transcript.trim() ? `"${transcript.trim()}"` : prompt}
        </div>
      </div>
      <div className="rec-controls">
        <button className="cancel-btn" onClick={() => setScreen('home')}>Cancel</button>
        <button className="stop-btn" onClick={handleDone}>⏹</button>
        <button className="cancel-btn" onClick={handleDone}>Done ›</button>
      </div>
    </div>
  );
}