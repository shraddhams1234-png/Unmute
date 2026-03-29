import { useState } from 'react';
import './App.css';
import HomeScreen from './components/HomeScreen';
import RecordingScreen from './components/RecordingScreen';
import SummaryScreen from './components/SummaryScreen';
import JournalScreen from './components/JournalScreen';
import CircleScreen from './components/CircleScreen';
import SisterAccessScreen from './components/SisterAccessScreen';
import FriendCircleScreen from './components/FriendCircleScreen';
import WeeklyReport from './components/WeeklyReport';

function App() {
  const [screen, setScreen] = useState('home');
  const [therapistResponse, setTherapistResponse] = useState('');
  const [emotions, setEmotions] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [showLangPicker, setShowLangPicker] = useState(false); // controls modal visibility
  const [savedAudios, setSavedAudios] = useState(() => {
    try {
      const saved = localStorage.getItem('unmute_audios');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [sisterContacts, setSisterContacts] = useState(() => {
    try {
      const saved = localStorage.getItem('sisterContacts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const addAudio = (audio) => {
    setSavedAudios(prev => {
      const updated = [audio, ...prev];
      try { localStorage.setItem('unmute_audios', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });
  };

  const deleteAudio = (index) => {
    setSavedAudios(prev => {
      const updated = prev.filter((_, i) => i !== index);
      try { localStorage.setItem('unmute_audios', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });
  };

  const saveSisterContact = (contact) => {
    setSisterContacts(prev => {
      const updated = [...prev, contact];
      try { localStorage.setItem('sisterContacts', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });
  };

  // Called when any "Record" button is tapped — show language picker first
  const handleRecordClick = () => setShowLangPicker(true);

  // Called when user picks a language
  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
    setShowLangPicker(false);
    setScreen('recording');
  };

  // Normal screen navigation
  const handleSetScreen = (s) => {
    if (s === 'recording') { setShowLangPicker(true); return; }
    if (s !== 'friend-circle') setSelectedLanguage(null);
    setScreen(s);
  };

  return (
    <div className="app">
      <div className="bg-bokeh">
        <div className="bokeh b1"></div><div className="bokeh b2"></div>
        <div className="bokeh b3"></div><div className="bokeh b4"></div>
        <div className="bokeh b5"></div>
      </div>
      <div className="phone-wrap">
        <div className="app-logo">unmute</div>
        <div className="app-tagline">त्वं प्रतिध्वनिः असि — "you are heard"</div>
        <div className="phone-frame" style={{ position: 'relative' }}>

          {/* Language picker — overlays whatever screen is currently shown */}
          {showLangPicker && (
            <LanguagePickerModal
              onSelect={handleLanguageSelect}
              onCancel={() => setShowLangPicker(false)}
            />
          )}

          {screen === 'home' && <HomeScreen setScreen={handleSetScreen} onRecord={handleRecordClick} />}
          {screen === 'recording' && selectedLanguage !== null && (
            <RecordingScreen
              setScreen={handleSetScreen}
              setTherapistResponse={setTherapistResponse}
              setEmotions={setEmotions}
              addAudio={addAudio}
              savedAudios={savedAudios}
              language={selectedLanguage}
            />
          )}
          {screen === 'summary' && (
            <SummaryScreen
              setScreen={handleSetScreen}
              therapistResponse={therapistResponse}
              emotions={emotions}
            />
          )}
          {screen === 'circle' && (
            <CircleScreen
              setScreen={handleSetScreen}
              sisterContacts={sisterContacts}
            />
          )}
          {screen === 'journal' && (
            <JournalScreen
              setScreen={handleSetScreen}
              savedAudios={savedAudios}
              deleteAudio={deleteAudio}
            />
          )}
          {screen === 'sister-access' && (
            <SisterAccessScreen
              setScreen={handleSetScreen}
              sisterContacts={sisterContacts}
              saveSisterContact={saveSisterContact}
            />
          )}
          {screen === 'friend-circle' && (
            <FriendCircleScreen
              setScreen={handleSetScreen}
            />
          )}
          {screen === 'report' && (
            <WeeklyReport
              savedAudios={savedAudios}
              setScreen={handleSetScreen}
            />
          )}
        </div>
        <div className="bottom-nav">
          <button className={`nav-item ${screen==='home'?'active':''}`} onClick={()=>handleSetScreen('home')}>
            <span className="nav-icon">🎙️</span><span className="nav-label">Record</span>
          </button>
          <button className={`nav-item ${screen==='circle'?'active':''}`} onClick={()=>handleSetScreen('circle')}>
            <span className="nav-icon">🌸</span><span className="nav-label">Circle</span>
          </button>
          <button className={`nav-item ${screen==='journal'?'active':''}`} onClick={()=>handleSetScreen('journal')}>
            <span className="nav-icon">📖</span><span className="nav-label">Journal</span>
          </button>
          <button className={`nav-item ${screen==='report'?'active':''}`} onClick={()=>handleSetScreen('report')}>
            <span className="nav-icon">📊</span><span className="nav-label">My Week</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Language Picker Modal
// ──────────────────────────────────────────────
function LanguagePickerModal({ onSelect, onCancel }) {
  const languages = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'hi', label: 'Hindi',   native: 'हिन्दी',  flag: '🇮🇳' },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(20,10,40,0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      borderRadius: 'inherit', padding: '32px 24px',
      gap: 20,
    }}>
      <div style={{ fontSize: 48 }}>🎙️</div>
      <div style={{ color: 'white', fontSize: 20, fontWeight: 600, textAlign: 'center' }}>
        Choose your language
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
        Dhvani will listen and respond<br />in your preferred language
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 8 }}>
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'rgba(200,184,232,0.1)',
              border: '1px solid rgba(200,184,232,0.25)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,184,232,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,184,232,0.1)'}
          >
            <span style={{ fontSize: 28 }}>{lang.flag}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>{lang.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{lang.native}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onCancel}
        style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.35)', fontSize: 13,
          cursor: 'pointer', marginTop: 4,
          fontFamily: 'inherit',
        }}
      >
        Cancel
      </button>
    </div>
  );
}

export default App;