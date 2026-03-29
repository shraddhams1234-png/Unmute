import { useState } from 'react';

export default function JournalScreen({ setScreen, savedAudios, deleteAudio }) {
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div className="screen">
      <div className="circle-header">
        <div className="circle-icon">📖</div>
        <div className="circle-title">My Journal</div>
        <div className="circle-sub">{savedAudios.length} voice {savedAudios.length===1?'entry':'entries'} saved</div>
      </div>

      {savedAudios.length === 0 && (
        <div className="empty-state">
          <div style={{fontSize:48, marginBottom:16}}>🌱</div>
          <div style={{color:'rgba(255,255,255,0.5)', textAlign:'center', fontSize:14, lineHeight:1.7}}>
            No entries yet.<br/>Start recording to begin your journey 🌸
          </div>
          <button className="record-feeling-btn" style={{marginTop:20}} onClick={()=>setScreen('recording')}>
            ✦ Record your first entry
          </button>
        </div>
      )}

      <div className="letters">
        {savedAudios.map((audio, i) => (
          <div key={audio.id || i} className="letter-card">
            <div className="letter-top">
              <div className="letter-avatar" style={{background:'rgba(232,97,74,0.2)'}}>🎙️</div>
              <div className="letter-meta">
                <div className="letter-anon" style={{color:'white', fontWeight:500}}>{audio.date}</div>
                <div className="letter-time">{audio.time} · {audio.duration}</div>
              </div>
              <button
                onClick={()=>setConfirmDelete(confirmDelete===i?null:i)}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'rgba(255,255,255,0.3)',padding:'4px 8px'}}
              >🗑️</button>
            </div>

            {confirmDelete === i && (
              <div style={{background:'rgba(232,97,74,0.15)',border:'1px solid rgba(232,97,74,0.3)',borderRadius:12,padding:12,marginBottom:10,textAlign:'center'}}>
                <div style={{color:'white',fontSize:13,marginBottom:10}}>Delete this entry?</div>
                <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                  <button onClick={()=>{deleteAudio(i);setConfirmDelete(null);if(expanded===i)setExpanded(null);}}
                    style={{background:'#e8614a',border:'none',borderRadius:8,padding:'6px 16px',color:'white',cursor:'pointer',fontSize:12}}>
                    Yes, delete
                  </button>
                  <button onClick={()=>setConfirmDelete(null)}
                    style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:8,padding:'6px 16px',color:'white',cursor:'pointer',fontSize:12}}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {audio.emotions && (
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                {audio.emotions.map((e,ei)=>(
                  <span key={ei} style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:'rgba(200,184,232,0.15)',color:'#c8b8e8',border:'1px solid rgba(200,184,232,0.3)'}}>
                    {e}
                  </span>
                ))}
              </div>
            )}

            <div className="letter-preview" style={{marginBottom:10}}>
              "{audio.transcript?.slice(0,100)}{audio.transcript?.length>100?'...':''}"
            </div>
{audio.audioURL && (
  <div style={{marginBottom:8}}>
    <audio controls src={audio.audioURL} style={{width:'100%', height:32, filter:'invert(1) hue-rotate(180deg)'}} />
  </div>
)}
            <button className="la-btn" style={{width:'100%'}} onClick={()=>setExpanded(expanded===i?null:i)}>
              {expanded===i ? "Hide Dhvani's response ▲" : "Read Dhvani's response ▼"}
            </button>

            {expanded===i && (
              <div style={{
                background:'rgba(200,184,232,0.08)',
                border:'1px solid rgba(200,184,232,0.2)',
                borderRadius:12, padding:14, marginTop:8,
                color:'rgba(255,255,255,0.85)', fontSize:13,
                lineHeight:1.8, whiteSpace:'pre-line'
              }}>
                {audio.response}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}