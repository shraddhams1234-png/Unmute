export default function HomeScreen({ setScreen }) {
  return (
    <div className="screen">
      <div className="greeting">
        <div className="greeting-small">good evening,</div>
        <div className="greeting-name">how are you feeling today?</div>
      </div>
      <div className="record-wrap">
        <div className="ring-outer"><div className="ring-inner">
          <button className="record-btn" onClick={()=>setScreen('recording')}>
            <span className="mic-icon">🎙️</span>
            <span className="record-label">RECORD</span>
          </button>
        </div></div>
        <div className="record-hint">tap to speak your truth</div>
      </div>
      <div className="modes">
        <div className="mode-card mode-active" onClick={()=>setScreen('recording')}>
          <div className="mode-icon">🎙️</div>
          <div className="mode-text">
            <div className="mode-title">Just for Me</div>
            <div className="mode-sub">Private, just record & reflect</div>
          </div>
          <span className="mode-arrow">›</span>
        </div>
        <div className="mode-card" onClick={()=>setScreen('circle')}>
          <div className="mode-icon">🌸</div>
          <div className="mode-text">
            <div className="mode-title">Send to SisterCircle</div>
            <div className="mode-sub">Anonymous, share with community</div>
          </div>
          <span className="mode-arrow">›</span>
        </div>
        <div className="mode-card" onClick={()=>setScreen('journal')}>
          <div className="mode-icon">📖</div>
          <div className="mode-text">
            <div className="mode-title">My Journal</div>
            <div className="mode-sub">All your saved voice entries</div>
          </div>
          <span className="mode-arrow">›</span>
        </div>
      </div>
    </div>
  );
}