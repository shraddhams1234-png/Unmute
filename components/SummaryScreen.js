export default function SummaryScreen({ setScreen, therapistResponse, emotions }) {
  const parts = therapistResponse ? therapistResponse.split('🎯 THIS WEEK:') : [];
  const mainResponse = parts[0]?.trim() || therapistResponse || '';
  const goalsAndQuestion = parts[1] || '';
  const goalLines = goalsAndQuestion.split('\n').filter(l => l.trim().startsWith('✦'));
  const questionLine = goalsAndQuestion.split('\n').find(l => l.trim().startsWith('💭'));

  return (
    <div className="screen">
      <div className="summary-header">
        <div className="summary-week">dhvani heard you 🌸</div>
        <div className="summary-title">Your session summary</div>
      </div>
      <div className="voice-viz">
        <div className="viz-wave">
          {['#e8614a','#f4a493','#c8b8e8','#9fe1cb','#e8614a','#f4a493','#c8b8e8','#e8614a','#9fe1cb','#f4a493',
            '#e8614a','#c8b8e8','#f4a493','#9fe1cb','#e8614a','#c8b8e8','#f4a493','#e8614a','#9fe1cb','#c8b8e8'
          ].map((color,i)=>(
            <div key={i} className="viz-bar" style={{background:color, animationDelay:`${i*0.1}s`}}></div>
          ))}
        </div>
        <div className="summary-insight" style={{whiteSpace:'pre-line', fontSize:14, lineHeight:1.9}}>
          {mainResponse}
        </div>
      </div>

      {goalLines.length > 0 && (
        <div className="goals-box">
          <div className="goals-title">🎯 This Week</div>
          {goalLines.map((goal, i) => (
            <div key={i} className="goal-item">{goal.trim()}</div>
          ))}
        </div>
      )}

      {questionLine && (
        <div className="question-box">
          <div style={{color:'#c8b8e8', fontSize:15, fontStyle:'italic', lineHeight:1.7}}>
            {questionLine.trim()}
          </div>
        </div>
      )}

      {emotions && emotions.length > 0 && (
        <div className="emotion-chips">
          {emotions.map((e, i) => (
            <div key={i} className={`chip chip-${i===0?'joy':i===1?'strength':'growth'}`}>{e}</div>
          ))}
        </div>
      )}

      <button className="record-feeling-btn" onClick={()=>setScreen('recording')}>
        ✦ Record another entry
      </button>
      <button className="cancel-btn" style={{color:'rgba(255,255,255,0.5)'}} onClick={()=>setScreen('journal')}>
        View my journal →
      </button>
    </div>
  );
}