import { useState, useEffect, useRef } from 'react';
import { callGroq } from '../services/groqService';

export default function RecordingScreen({ setScreen, setTherapistResponse, setEmotions, addAudio, savedAudios }) {
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [audioURL, setAudioURL] = useState(null);

  const prompts = [
    '"What\'s been weighing on your heart today?"',
    '"Tell me about a moment this week that surprised you…"',
    '"What do you wish someone had told you today?"',
    '"What emotion are you carrying right now?"',
    '"Is there something you haven\'t said out loud yet?"',
    '"What made you smile today, even a little?"',
  ];
  const [prompt] = useState(prompts[Math.floor(Math.random()*prompts.length)]);

  const toneVariants = [
    "Speak like a calm wise older sister who has been through it all.",
    "Speak like a supportive best friend who truly gets the Indian experience.",
    "Speak like someone who gently guides without judging.",
    "Speak like someone who deeply understands family pressure and personal dreams.",
  ];
  const randomTone = toneVariants[Math.floor(Math.random()*toneVariants.length)];

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s+1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Start speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN';
      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
            finalTranscriptRef.current = finalTranscript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
      };
      rec.start();
      recognitionRef.current = rec;
    }

    // Start audio recording
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
      })
      .catch(e => console.log('Mic error:', e));

    return () => {
      try { recognitionRef.current?.stop(); } catch(e) {}
      try {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch(e) {}
    };
  }, []);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const callGroqWithRetry = async (messages, maxTokens, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        if (i > 0) {
          setLoadingMsg(`Almost there... (attempt ${i+1})`);
          await sleep(2000 * i);
        }
        return await callGroq(messages, maxTokens);
      } catch(e) {
        console.log(`Attempt ${i+1} failed:`, e);
        if (i === retries - 1) throw e;
      }
    }
  };

  const handleDone = async () => {
    try { recognitionRef.current?.stop(); } catch(e) {}
    try {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch(e) {}

    const cleanTranscript = finalTranscriptRef.current.trim() || transcript.trim();

    if (!cleanTranscript || cleanTranscript.length < 5) {
      setTherapistResponse(`Hey… I noticed you didn't say anything, and that's completely okay 💙\n\nSometimes the words just don't come, and silence can mean so many things — maybe you're overwhelmed, maybe you're not sure where to start, or maybe you just needed a moment to breathe. All of that is valid.\n\nI'm not going anywhere. Whenever you're ready — even one sentence, even something that doesn't make sense — I'm here. No pressure, no judgment. Just us.\n\nWant to try again? Take a deep breath first. I'll be right here waiting 🌸`);
      setEmotions(['💙 Processing', '🌿 Stillness', '✨ Courage']);
      setScreen('summary');
      return;
    }

    setLoading(true);

    const pastEntries = savedAudios.slice(0, 5).map((a, i) =>
      `Entry ${i+1} (${a.date}): "${a.transcript}"`
    ).join('\n');

    try {
      setLoadingMsg('Dhvani is listening deeply...');

      const aiResponse = await callGroqWithRetry([
        {
          role: 'system',
          content: `You are Dhvani — a deeply empathetic AI therapist for young Indian women. ${randomTone}

STRICT RULES:
1. NEVER start with "I hear you" or "It sounds like" or "Thank you for sharing"
2. ALWAYS quote ONE exact phrase from what they said in quotes
3. ALWAYS be specific — reference exactly what they mentioned
4. Sound warm, human, like a real friend — never robotic
5. Minimum 8 sentences
6. Validate → gently challenge → empower
7. Use occasional Hindi/English mix naturally
8. NEVER give generic advice — be specific to their exact words
9. Vary your opening every single time — be creative

FORMAT:
[Warm specific response min 8 sentences referencing their exact words]

🎯 THIS WEEK:
✦ [Specific goal from their exact words]
✦ [Specific goal from their exact words]
✦ [Specific goal from their exact words]

💭 [One powerful question specific to their situation]`
        },
        {
          role: 'user',
          content: `Past journal entries (notice patterns):
${pastEntries || 'First entry ever — make them feel especially welcome.'}

What I said today (respond to EXACTLY this, quote my words):
"${cleanTranscript}"

Be Dhvani. Be specific. Be real.`
        }
      ], 1000);

      setLoadingMsg('Understanding your emotions...');
      await sleep(500);

      const emotionText = await callGroqWithRetry([
        {
          role: 'system',
          content: 'You detect emotions. Return ONLY a valid JSON array of exactly 3 strings with emoji + emotion. No explanation. No extra text.'
        },
        {
          role: 'user',
          content: `Detect 3 specific emotions from: "${cleanTranscript}"
Return ONLY: ["😔 Emotion", "💪 Emotion", "✨ Emotion"]`
        }
      ], 100);

      let detectedEmotions = ['💙 Heard', '🌸 Supported', '✨ Growing'];
      try {
        const match = emotionText.match(/\[.*?\]/s);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) detectedEmotions = parsed;
        }
      } catch(e) {}

      // wait for audioURL to be set
      await sleep(800);

      const newAudio = {
        id: Date.now(),
        transcript: cleanTranscript,
        response: aiResponse,
        emotions: detectedEmotions,
        audioURL: audioURL,
        date: new Date().toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
        duration: `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`,
      };

      addAudio(newAudio);
      setTherapistResponse(aiResponse);
      setEmotions(detectedEmotions);
      setLoading(false);
      setScreen('summary');

    } catch (error) {
      console.error('Groq error:', error);

      // Smart fallback based on transcript
      const lower = cleanTranscript.toLowerCase();
      let fallback = '';

      if (lower.includes('stress') || lower.includes('pressure') || lower.includes('overwhelm')) {
        fallback = `"${cleanTranscript.slice(0,60)}..." — I can feel the weight of what you're carrying right now, yaar. That kind of pressure doesn't just live in your head — it sits in your chest, it messes with your sleep, it makes everything feel heavier than it should. And the fact that you're here, speaking it out loud? That already takes courage.\n\nYou don't have to fix everything today. You just have to get through today.\n\n🎯 THIS WEEK:\n✦ Write down the ONE thing stressing you most and break it into 3 tiny steps\n✦ Give yourself one hour this week with zero productivity — just rest, no guilt\n✦ Tell one person you trust how you're really doing\n\n💭 If you could put down just ONE thing you're carrying right now, what would it be?`;
      } else if (lower.includes('family') || lower.includes('parents') || lower.includes('mom') || lower.includes('dad')) {
        fallback = `"${cleanTranscript.slice(0,60)}..." — Family pressure hits differently na. It's not just pressure — it comes wrapped in love, which makes it so much harder to push back against. You love them AND you're suffocating. Both things are true at the same time.\n\nYou are allowed to have your own path, even if they can't see it yet.\n\n🎯 THIS WEEK:\n✦ Write a letter to your family that you don't send — say everything you can't say out loud\n✦ Find one small way to honour your own needs this week\n✦ Talk to one person outside your family who gets you\n\n💭 What is one thing you wish your family understood about you that they currently don't?`;
      } else if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleep')) {
        fallback = `"${cleanTranscript.slice(0,60)}..." — That tiredness you're feeling? It's real. And I don't think it's just physical — it sounds like the kind of tired that comes from carrying too much for too long without anyone noticing.\n\nYou are allowed to rest. Resting is not giving up. Resting is how you come back stronger.\n\n🎯 THIS WEEK:\n✦ Set one boundary this week — say no to something that drains you\n✦ Sleep 30 minutes earlier than usual for 3 days\n✦ Do one thing purely because it brings you joy, no justification needed\n\n💭 What would truly restful — not just sleep, but soul rest — look like for you right now?`;
      } else {
        fallback = `"${cleanTranscript.slice(0,60)}..." — What you just shared matters more than you know. There's something so brave about speaking your truth, even when you're not sure how it'll land. I hear every word.\n\nYou are not too much. You are not overreacting. What you feel is valid.\n\n🎯 THIS WEEK:\n✦ Check in with yourself every morning — just 2 minutes, asking "how am I really feeling?"\n✦ Do one small thing today that is purely for you\n✦ Write down one thing you're proud of yourself for this week\n\n💭 What is one thing you need right now that you haven't allowed yourself to ask for?`;
      }

      setTherapistResponse(fallback);
      setEmotions(['💙 Heard', '🌸 Seen', '✨ Growing']);

      const newAudio = {
        id: Date.now(),
        transcript: cleanTranscript,
        response: fallback,
        emotions: ['💙 Heard', '🌸 Seen', '✨ Growing'],
        audioURL: audioURL,
        date: new Date().toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
        duration: `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`,
      };
      addAudio(newAudio);
      setLoading(false);
      setScreen('summary');
    }
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  if (loading) {
    return (
      <div className="screen" style={{justifyContent:'center', gap:24}}>
        <div style={{fontSize:64}}>🌸</div>
        <div style={{color:'white', fontSize:18, fontWeight:300, textAlign:'center', padding:'0 20px'}}>
          {loadingMsg}
        </div>
        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
        <div style={{color:'rgba(255,255,255,0.4)', fontSize:13, textAlign:'center', padding:'0 40px', lineHeight:1.7}}>
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
      </div>
      <div className="waveform-wrap">
        {[20,35,50,40,60,45,55,30,48,38,60,28,42,58,34,50,22,44,56,32].map((h,i)=>(
          <div key={i} className="wave-bar" style={{height:h}}></div>
        ))}
      </div>
      <div className="timer-wrap">
        <div className="timer">{formatTime(seconds)}</div>
        <div className="timer-label">🎙️ listening...</div>
      </div>
      <div className="prompt-box">
        <div className="prompt-text" style={transcript.trim()?{color:'rgba(255,255,255,0.85)',fontStyle:'normal',fontSize:'13px',lineHeight:'1.7'}:{}}>
          {transcript.trim() ? `"${transcript.trim()}"` : prompt}
        </div>
      </div>
      <div className="rec-controls">
        <button className="cancel-btn" onClick={()=>setScreen('home')}>Cancel</button>
        <button className="stop-btn" onClick={handleDone}>⏹</button>
        <button className="cancel-btn" onClick={handleDone}>Done ›</button>
      </div>
    </div>
  );
}