import { useState, useEffect } from 'react';

const emotionToScore = (emotions) => {
  if (!emotions || emotions.length === 0) return 5;
  const positive = ['joy', 'happy', 'excited', 'proud', 'grateful', 'peace', 'content', 'love', 'hope', 'strength', 'resilience', 'calm', 'light', 'joyful', 'blessed', 'elated', 'ಸಂತೋಷ', 'ಖುಷಿ', 'खुशी', 'उजाला'];
  const negative = ['sad', 'anxious', 'stress', 'overwhelm', 'tired', 'exhaust', 'anger', 'fear', 'lonely', 'guilt', 'shame', 'worry', 'fearful', 'hopeless', 'broken', 'ದುಃಖ', 'ಒತ್ತಡ', 'दुखी', 'तनाव'];
  let score = 5;
  const emotionStr = emotions.join(' ').toLowerCase();
  positive.forEach(p => { if (emotionStr.includes(p)) score += 1.5; });
  negative.forEach(n => { if (emotionStr.includes(n)) score -= 1.5; });
  return Math.min(10, Math.max(1, Math.round(score)));
};

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const scoreColors = { high: '#9fe1cb', mid: '#f4a493', low: '#c8b8e8' };

const getBarColor = (score) => {
  if (score >= 7) return scoreColors.high;
  if (score >= 4) return scoreColors.mid;
  return scoreColors.low;
};

const getMoodLabel = (score) => {
  if (score >= 7) return { label: 'Thriving 🌟', color: scoreColors.high };
  if (score >= 4) return { label: 'Processing 🌸', color: scoreColors.mid };
  return { label: 'Needs Care 💙', color: scoreColors.low };
};

export default function WeeklyReport({ savedAudios, setScreen }) {
  const [weekData, setWeekData] = useState([]);
  const [topEmotions, setTopEmotions] = useState([]);
  const [avgScore, setAvgScore] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return {
        day: days[d.getDay()],
        isToday: i === 6,
        dateStr: d.toDateString(),
        dayStart: d.getTime(),
        dayEnd: d.getTime() + 86400000,
        entries: [],
        score: null,
      };
    });

    savedAudios.forEach(audio => {
      const audioTime = audio.id;
      const match = last7.find(d => audioTime >= d.dayStart && audioTime < d.dayEnd);
      if (match) match.entries.push(audio);
    });

    last7.forEach(d => {
      if (d.entries.length > 0) {
        const scores = d.entries.map(e => emotionToScore(e.emotions));
        d.score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    });

    setWeekData(last7);

    const allEmotions = savedAudios
      .filter(a => a.id >= now.getTime() - 7 * 86400000)
      .flatMap(a => a.emotions || []);

    const emotionCount = {};
    allEmotions.forEach(e => { emotionCount[e] = (emotionCount[e] || 0) + 1; });
    const sorted = Object.entries(emotionCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    setTopEmotions(sorted.map(([e]) => e));

    const scored = last7.filter(d => d.score !== null);
    if (scored.length > 0) {
      setAvgScore(Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length));
    }

    setTotalEntries(savedAudios.filter(a => a.id >= now.getTime() - 7 * 86400000).length);

    let streak = 0;
    for (let i = last7.length - 1; i >= 0; i--) {
      if (last7[i].entries.length > 0) streak++;
      else break;
    }
    setStreakDays(streak);

  }, [savedAudios]);

  const maxScore = Math.max(...weekData.map(d => d.score || 0), 1);

  return (
    <div className="screen">
      <div className="summary-header">
        <div className="summary-week">your emotional journey</div>
        <div className="summary-title">Weekly Report 📊</div>
      </div>

      {savedAudios.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14, lineHeight: 1.7 }}>
            No entries yet!!<br />Record your first entry to see your emotional report 🌸
          </div>
          <button className="record-feeling-btn" style={{ marginTop: 20 }} onClick={() => setScreen('recording')}>
            ✦ Start Recording
          </button>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '14px 12px', textAlign: 'center'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>ENTRIES</div>
              <div style={{ color: 'white', fontSize: 24, fontWeight: 500 }}>{totalEntries}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>this week</div>
            </div>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '14px 12px', textAlign: 'center'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>STREAK</div>
              <div style={{ color: '#f4a493', fontSize: 24, fontWeight: 500 }}>{streakDays}🔥</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>days in a row</div>
            </div>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '14px 12px', textAlign: 'center'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>MOOD</div>
              <div style={{ color: '#9fe1cb', fontSize: 24, fontWeight: 500 }}>{avgScore}/10</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>avg score</div>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{
            width: '100%', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, padding: 20
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16, textAlign: 'center', letterSpacing: 1 }}>
              MOOD THIS WEEK
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: 6, marginBottom: 12 }}>
              {weekData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {d.score && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                      {d.score}
                    </div>
                  )}
                  <div style={{
                    width: '100%', borderRadius: 6,
                    background: d.score ? getBarColor(d.score) : 'rgba(255,255,255,0.08)',
                    height: d.score ? `${(d.score / 10) * 100}px` : '8px',
                    transition: 'height 0.5s ease',
                    minHeight: 8,
                    border: d.isToday ? '2px solid rgba(255,255,255,0.4)' : 'none',
                    boxSizing: 'border-box',
                  }} />
                  <div style={{
                    fontSize: 10,
                    color: d.isToday ? 'white' : 'rgba(255,255,255,0.4)',
                    fontWeight: d.isToday ? 600 : 400
                  }}>
                    {d.isToday ? 'Today' : d.day}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              {Object.entries(scoreColors).map(([key, color]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    {key === 'high' ? 'Thriving' : key === 'mid' ? 'Processing' : 'Needs Care'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overall mood */}
          {avgScore > 0 && (
            <div style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, padding: 18,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>OVERALL MOOD</div>
                <div style={{ color: 'white', fontSize: 22, fontWeight: 500 }}>
                  {getMoodLabel(avgScore).label}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
                  based on {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} this week
                </div>
              </div>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `conic-gradient(${getMoodLabel(avgScore).color} ${avgScore * 36}deg, rgba(255,255,255,0.08) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: '#0d1b3e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 16, fontWeight: 500
                }}>
                  {avgScore}
                </div>
              </div>
            </div>
          )}

          {/* Top emotions */}
          {topEmotions.length > 0 && (
            <div style={{
              width: '100%', background: 'rgba(200,184,232,0.08)',
              border: '1px solid rgba(200,184,232,0.2)',
              borderRadius: 16, padding: 18
            }}>
              <div style={{ color: '#c8b8e8', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                🌸 Your most felt emotions this week
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {topEmotions.map((e, i) => (
                  <div key={i} className={`chip chip-${i === 0 ? 'joy' : i === 1 ? 'strength' : 'growth'}`}>
                    {e}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dhvani weekly reflection */}
          <div style={{
            width: '100%', background: 'rgba(232,97,74,0.08)',
            border: '1px solid rgba(232,97,74,0.2)',
            borderRadius: 16, padding: 18
          }}>
            <div style={{ color: '#f4a493', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              💭 Dhvani's weekly reflection
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>
              {streakDays >= 3
                ? `${streakDays} days in a row — that's not a habit yet, that's a commitment. You're choosing yourself every day, and that matters more than you know. Keep going 🌟`
                : avgScore >= 7
                ? "You've had a genuinely strong week. Your entries show real self-awareness and growth. This is what showing up for yourself looks like — remember this feeling 🌟"
                : avgScore >= 4
                ? "This week had its ups and downs — and that's completely human. The fact that you're here, tracking your feelings, already means you're doing the work most people avoid 🌸"
                : "This week felt heavy, didn't it? I see you carrying a lot. Hard weeks don't define you — they're just seasons. Be extra gentle with yourself. You deserve that 💙"
              }
            </div>
          </div>

          {/* Today's entries preview */}
          {weekData[6]?.entries?.length > 0 && (
            <div style={{
              width: '100%', background: 'rgba(159,225,203,0.08)',
              border: '1px solid rgba(159,225,203,0.2)',
              borderRadius: 16, padding: 18
            }}>
              <div style={{ color: '#9fe1cb', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                ✨ Today's entries ({weekData[6].entries.length})
              </div>
              {weekData[6].entries.map((entry, i) => (
                <div key={i} style={{
                  padding: '8px 0',
                  borderBottom: i < weekData[6].entries.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{entry.time} · </span>
                  "{entry.transcript?.slice(0, 80)}{entry.transcript?.length > 80 ? '...' : ''}"
                </div>
              ))}
            </div>
          )}

          <button className="record-feeling-btn" onClick={() => setScreen('recording')}>
            ✦ Record today's entry
          </button>
        </>
      )}
    </div>
  );
}