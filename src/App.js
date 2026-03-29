import { useState } from 'react';
import './App.css';
import HomeScreen from './components/HomeScreen';
import RecordingScreen from './components/RecordingScreen';
import SummaryScreen from './components/SummaryScreen';
import JournalScreen from './components/JournalScreen';
import CircleScreen from './components/CircleScreen';
import SisterAccessScreen from './components/SisterAccessScreen';
import WeeklyReport from './components/WeeklyReport';

function App() {
  const [screen, setScreen] = useState('home');
  const [therapistResponse, setTherapistResponse] = useState('');
  const [emotions, setEmotions] = useState([]);
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
        <div className="phone-frame">
          {screen === 'home' && <HomeScreen setScreen={setScreen} />}
          {screen === 'recording' && (
            <RecordingScreen
              setScreen={setScreen}
              setTherapistResponse={setTherapistResponse}
              setEmotions={setEmotions}
              addAudio={addAudio}
              savedAudios={savedAudios}
            />
          )}
          {screen === 'summary' && (
            <SummaryScreen
              setScreen={setScreen}
              therapistResponse={therapistResponse}
              emotions={emotions}
            />
          )}
          {screen === 'circle' && (
            <CircleScreen
              setScreen={setScreen}
              sisterContacts={sisterContacts}
            />
          )}
          {screen === 'journal' && (
            <JournalScreen
              setScreen={setScreen}
              savedAudios={savedAudios}
              deleteAudio={deleteAudio}
            />
          )}
          {screen === 'sister-access' && (
            <SisterAccessScreen
              setScreen={setScreen}
              sisterContacts={sisterContacts}
              saveSisterContact={saveSisterContact}
            />
          )}
          {screen === 'report' && (
            <WeeklyReport
              savedAudios={savedAudios}
              setScreen={setScreen}
            />
          )}
        </div>
        <div className="bottom-nav">
          <button className={`nav-item ${screen==='home'?'active':''}`} onClick={()=>setScreen('home')}>
            <span className="nav-icon">🎙️</span><span className="nav-label">Record</span>
          </button>
          <button className={`nav-item ${screen==='circle'?'active':''}`} onClick={()=>setScreen('circle')}>
            <span className="nav-icon">🌸</span><span className="nav-label">Circle</span>
          </button>
          <button className={`nav-item ${screen==='journal'?'active':''}`} onClick={()=>setScreen('journal')}>
            <span className="nav-icon">📖</span><span className="nav-label">Journal</span>
          </button>
          <button className={`nav-item ${screen==='report'?'active':''}`} onClick={()=>setScreen('report')}>
            <span className="nav-icon">📊</span><span className="nav-label">My Week</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;