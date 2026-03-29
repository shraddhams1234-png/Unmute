import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot, orderBy,
  query, serverTimestamp, doc, setDoc, getDoc, deleteDoc
} from 'firebase/firestore';

// Generate or retrieve a persistent anonymous display name for this user
function getOrCreateUser() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('unmute_chat_user')); } catch(e) {}
  if (!user) {
    const adjectives = ['Gentle', 'Brave', 'Warm', 'Quiet', 'Soft', 'Bold', 'Calm', 'Kind', 'Wild', 'Sweet'];
    const nouns = ['Lotus', 'Moon', 'River', 'Star', 'Flame', 'Petal', 'Dawn', 'Cloud', 'Wave', 'Spark'];
    const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    const colors = ['#e8614a', '#c8b8e8', '#9fe1cb', '#f4a493', '#ffd93d', '#a8edea'];
    user = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    try { localStorage.setItem('unmute_chat_user', JSON.stringify(user)); } catch(e) {}
  }
  return user;
}

export default function FriendCircleScreen({ setScreen, roomCode: initialRoomCode }) {
  const [phase, setPhase] = useState('lobby'); // lobby | creating | joining | chat
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [roomName, setRoomName] = useState('');
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const messagesEndRef = useRef(null);
  const user = useRef(getOrCreateUser()).current;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If navigated in with a room code already (deep link), auto-join
  useEffect(() => {
    if (initialRoomCode) joinRoom(initialRoomCode);
  }, []); // eslint-disable-line

  // Listen to messages + members when in a room
  useEffect(() => {
    if (phase !== 'chat' || !roomCode) return;

    // Mark this user as present
    const presenceRef = doc(db, 'friendCircles', roomCode, 'members', user.id);
    setDoc(presenceRef, { name: user.name, color: user.color, joinedAt: serverTimestamp() });

    // Listen to messages
    const msgsQ = query(
      collection(db, 'friendCircles', roomCode, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubMsgs = onSnapshot(msgsQ, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen to members
    const unsubMembers = onSnapshot(
      collection(db, 'friendCircles', roomCode, 'members'),
      snap => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Remove presence on unmount
    return () => {
      unsubMsgs();
      unsubMembers();
      deleteDoc(presenceRef).catch(() => {});
    };
  }, [phase, roomCode]); // eslint-disable-line

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const createRoom = async (name) => {
    const code = generateCode();
    try {
      await setDoc(doc(db, 'friendCircles', code), {
        name: name || `${user.name}'s Circle`,
        createdBy: user.id,
        createdAt: serverTimestamp(),
      });
      // Post a welcome system message
      await addDoc(collection(db, 'friendCircles', code, 'messages'), {
        text: `${user.name} created this circle 🌸 Share the code to invite friends!`,
        senderId: 'system',
        senderName: 'Unmute',
        createdAt: serverTimestamp(),
        isSystem: true,
      });
      setRoomCode(code);
      setRoomName(name || `${user.name}'s Circle`);
      setPhase('chat');
    } catch(e) {
      console.error(e);
      setError('Could not create room. Check your connection.');
    }
  };

  const joinRoom = async (code) => {
    const trimmed = (code || joinInput).trim().toUpperCase();
    if (trimmed.length < 4) { setError('Enter a valid room code.'); return; }
    try {
      const roomDoc = await getDoc(doc(db, 'friendCircles', trimmed));
      if (!roomDoc.exists()) { setError('Room not found. Check the code and try again.'); return; }
      const data = roomDoc.data();
      setRoomCode(trimmed);
      setRoomName(data.name || 'Friend Circle');
      // Post join message
      await addDoc(collection(db, 'friendCircles', trimmed, 'messages'), {
        text: `${user.name} joined the circle 💛`,
        senderId: 'system',
        senderName: 'Unmute',
        createdAt: serverTimestamp(),
        isSystem: true,
      });
      setPhase('chat');
    } catch(e) {
      console.error(e);
      setError('Could not join room. Try again.');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !roomCode) return;
    const text = inputText.trim();
    setInputText('');
    try {
      await addDoc(collection(db, 'friendCircles', roomCode, 'messages'), {
        text,
        senderId: user.id,
        senderName: user.name,
        senderColor: user.color,
        createdAt: serverTimestamp(),
        isSystem: false,
      });
    } catch(e) {
      console.error('Send failed:', e);
      setInputText(text); // restore on fail
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveRoom = async () => {
    if (roomCode) {
      try {
        await addDoc(collection(db, 'friendCircles', roomCode, 'messages'), {
          text: `${user.name} left the circle`,
          senderId: 'system',
          senderName: 'Unmute',
          createdAt: serverTimestamp(),
          isSystem: true,
        });
      } catch(e) {}
    }
    setPhase('lobby');
    setRoomCode('');
    setMessages([]);
    setMembers([]);
    setJoinInput('');
    setError('');
  };

  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // ── LOBBY ────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="screen">
        <div className="circle-header">
          <div className="circle-icon">👯‍♀️</div>
          <div className="circle-title">Friend Circle</div>
          <div className="circle-sub">private live chat with your people</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 16 }}>

          {/* Create a room */}
          <button
            onClick={() => setPhase('creating')}
            style={{
              width: '100%', padding: '18px 20px',
              background: 'linear-gradient(135deg, rgba(232,97,74,0.25), rgba(200,184,232,0.15))',
              border: '1px solid rgba(232,97,74,0.4)',
              borderRadius: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 32 }}>✨</span>
            <div>
              <div style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>Create a Circle</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                Start a new group, get a code to share
              </div>
            </div>
          </button>

          {/* Join a room */}
          <button
            onClick={() => setPhase('joining')}
            style={{
              width: '100%', padding: '18px 20px',
              background: 'rgba(200,184,232,0.1)',
              border: '1px solid rgba(200,184,232,0.25)',
              borderRadius: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 32 }}>🔑</span>
            <div>
              <div style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>Join a Circle</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                Enter a code from a friend
              </div>
            </div>
          </button>

          {/* Info card */}
          <div style={{
            marginTop: 8, padding: '14px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.7 }}>
              💛 Like a WhatsApp group — but private & anonymous.<br />
              Share a 6-letter code with your friends to chat live.<br />
              Your name here is <span style={{ color: '#c8b8e8' }}>{user.name}</span>.
            </div>
          </div>
        </div>

        <button
          onClick={() => setScreen('circle')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', marginTop: 20, fontFamily: 'inherit' }}
        >
          ← Back to SisterCircle
        </button>
      </div>
    );
  }

  // ── CREATE ────────────────────────────────────────────
  if (phase === 'creating') {
    return (
      <div className="screen">
        <div className="circle-header">
          <div className="circle-icon">✨</div>
          <div className="circle-title">Create a Circle</div>
          <div className="circle-sub">name your group</div>
        </div>

        <div style={{ width: '100%', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={nameInput}
            onChange={e => { setNameInput(e.target.value); setError(''); }}
            placeholder={`${user.name}'s Circle`}
            maxLength={30}
            style={{
              width: '100%', padding: 14,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, color: 'white', fontSize: 15,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          {error && <div style={{ color: '#f4a493', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          <button
            onClick={() => createRoom(nameInput)}
            style={{
              width: '100%', padding: 14,
              background: 'linear-gradient(135deg, #e8614a, #c8b8e8)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            💛 Create Circle
          </button>
          <button onClick={() => { setPhase('lobby'); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── JOIN ────────────────────────────────────────────
  if (phase === 'joining') {
    return (
      <div className="screen">
        <div className="circle-header">
          <div className="circle-icon">🔑</div>
          <div className="circle-title">Join a Circle</div>
          <div className="circle-sub">enter the code your friend shared</div>
        </div>

        <div style={{ width: '100%', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={joinInput}
            onChange={e => { setJoinInput(e.target.value.toUpperCase()); setError(''); }}
            placeholder="e.g. ABC123"
            maxLength={6}
            style={{
              width: '100%', padding: 16,
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${error ? 'rgba(232,97,74,0.5)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 12, color: 'white', fontSize: 22,
              outline: 'none', fontFamily: 'monospace',
              textAlign: 'center', letterSpacing: 6,
            }}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
          />
          {error && <div style={{ color: '#f4a493', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          <button
            onClick={() => joinRoom()}
            style={{
              width: '100%', padding: 14,
              background: 'linear-gradient(135deg, #e8614a, #c8b8e8)',
              border: 'none', borderRadius: 12,
              color: 'white', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🔑 Join Circle
          </button>
          <button onClick={() => { setPhase('lobby'); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── CHAT ────────────────────────────────────────────
  return (
    <div className="screen" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={leaveRoom}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', padding: 0 }}>
              ←
            </button>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{roomName}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                {members.length} {members.length === 1 ? 'person' : 'people'} here now
              </div>
            </div>
          </div>

          {/* Code badge + copy */}
          <button onClick={copyCode} style={{
            background: copied ? 'rgba(93,202,165,0.2)' : 'rgba(200,184,232,0.15)',
            border: `1px solid ${copied ? 'rgba(93,202,165,0.4)' : 'rgba(200,184,232,0.3)'}`,
            borderRadius: 10, padding: '5px 10px',
            color: copied ? '#9fe1cb' : '#c8b8e8',
            fontSize: 12, cursor: 'pointer', fontFamily: 'monospace',
            fontWeight: 700, letterSpacing: 2,
          }}>
            {copied ? '✓ Copied!' : roomCode}
          </button>
        </div>

        {/* Members row */}
        {members.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {members.slice(0, 8).map(m => (
              <div key={m.id} style={{
                padding: '2px 8px', borderRadius: 20,
                background: `${m.color}22`,
                border: `1px solid ${m.color}55`,
                color: m.color, fontSize: 10, fontWeight: 500,
              }}>
                {m.id === user.id ? `${m.name} (you)` : m.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🌸</div>
            No messages yet — say hello!
          </div>
        )}

        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, padding: '4px 0' }}>
                {msg.text}
              </div>
            );
          }

          const isMe = msg.senderId === user.id;
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
            }}>
              {!isMe && (
                <div style={{ color: msg.senderColor || '#c8b8e8', fontSize: 11, marginBottom: 3, marginLeft: 4 }}>
                  {msg.senderName}
                </div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '9px 13px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe
                  ? 'linear-gradient(135deg, rgba(232,97,74,0.7), rgba(200,184,232,0.5))'
                  : 'rgba(255,255,255,0.08)',
                border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: 13, lineHeight: 1.5,
                wordBreak: 'break-word',
              }}>
                {msg.text}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 2, marginLeft: 4, marginRight: 4 }}>
                {formatTime(msg.createdAt)}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'rgba(255,255,255,0.03)',
        flexShrink: 0,
      }}>
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: '10px 14px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 22, color: 'white', fontSize: 13,
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: inputText.trim() ? 'linear-gradient(135deg, #e8614a, #c8b8e8)' : 'rgba(255,255,255,0.1)',
            border: 'none', cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}