import { useState } from 'react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_60gixls';
const EMAILJS_TEMPLATE_ID = 'template_tw6m0ui';
const EMAILJS_PUBLIC_KEY = 'AGfknQmPBI3UZBW97';


export default function JoinCircleScreen({ setScreen, setCircleId, setUserNickname, circleId, userNickname }) {
  const [tab, setTab] = useState('create');
  const [nickname, setNickname] = useState(userNickname || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [sending, setSending] = useState(false);

  const generateCircleId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async () => {
    if (!nickname.trim()) {
      setMessageType('error');
      setMessage('Please enter a nickname!!');
      return;
    }

    const newId = generateCircleId();
    setCircleId(newId);
    setUserNickname(nickname.trim());

    try {
      localStorage.setItem('circleId', newId);
      localStorage.setItem('userNickname', nickname.trim());
    } catch(e) {}

    setMessageType('success');
    setMessage(`✨ Circle created!! Your code is: ${newId}`);

    setTimeout(() => setScreen('friend-circle'), 1500);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(inviteEmail)) {
      setMessageType('error');
      setMessage('⚠️ Please enter a valid email!!');
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: inviteEmail.trim(),
          to_name: 'Sister',
          from_name: nickname || 'Your Sister',
          message: `You've been invited to join a private Friend Circle on Unmute! Use this code to join: ${circleId}`,
          app_link: `https://pratidhvani.vercel.app`,
          reply_to: inviteEmail.trim(),
        },
        EMAILJS_PUBLIC_KEY
      );
      setMessageType('success');
      setMessage(`✨ Invite sent to ${inviteEmail}!! They got the circle code 💛`);
      setInviteEmail('');
    } catch(e) {
      setMessageType('error');
      setMessage('Something went wrong!! Try again.');
    }
    setSending(false);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setMessageType('error');
      setMessage('Please enter a circle code!!');
      return;
    }
    if (!nickname.trim()) {
      setMessageType('error');
      setMessage('Please enter a nickname first!!');
      return;
    }
    const code = joinCode.trim().toUpperCase();
    setCircleId(code);
    setUserNickname(nickname.trim());
    try {
      localStorage.setItem('circleId', code);
      localStorage.setItem('userNickname', nickname.trim());
    } catch(e) {}
    setMessageType('success');
    setMessage(`✨ Joined circle ${code}!!`);
    setTimeout(() => setScreen('friend-circle'), 1000);
  };

  return (
    <div className="screen">
      <div className="circle-header">
        <div className="circle-icon">💛</div>
        <div className="circle-title">Friend Circle</div>
        <div className="circle-sub">a private space for you and your people</div>
      </div>

      {/* Nickname input */}
      <div style={{ width: '100%' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>YOUR NICKNAME</div>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="What should we call you? 🌸"
          style={{
            width: '100%', padding: 14,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, color: 'white', fontSize: 14,
            outline: 'none', fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', width: '100%', gap: 8 }}>
        <button onClick={() => setTab('create')} style={{
          flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, cursor: 'pointer',
          background: tab === 'create' ? 'rgba(232,97,74,0.2)' : 'rgba(255,255,255,0.06)',
          border: tab === 'create' ? '1px solid #e8614a' : '1px solid rgba(255,255,255,0.12)',
          color: tab === 'create' ? '#f4a493' : 'rgba(255,255,255,0.5)',
          fontFamily: 'inherit'
        }}>✨ Create Circle</button>
        <button onClick={() => setTab('join')} style={{
          flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, cursor: 'pointer',
          background: tab === 'join' ? 'rgba(232,97,74,0.2)' : 'rgba(255,255,255,0.06)',
          border: tab === 'join' ? '1px solid #e8614a' : '1px solid rgba(255,255,255,0.12)',
          color: tab === 'join' ? '#f4a493' : 'rgba(255,255,255,0.5)',
          fontFamily: 'inherit'
        }}>🔑 Join Circle</button>
      </div>

      {tab === 'create' ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={handleCreate} style={{
            width: '100%', padding: 14,
            background: 'linear-gradient(135deg, #e8614a, #c8b8e8)',
            border: 'none', borderRadius: 12,
            color: 'white', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            💛 Create My Circle
          </button>

          {circleId && (
            <>
              <div style={{
                padding: 16, borderRadius: 12,
                background: 'rgba(200,184,232,0.1)',
                border: '1px solid rgba(200,184,232,0.25)',
                textAlign: 'center'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8 }}>YOUR CIRCLE CODE</div>
                <div style={{ color: 'white', fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>{circleId}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 }}>Share this with your friends!!</div>
              </div>

              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>INVITE BY EMAIL</div>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Friend's email address"
                style={{
                  width: '100%', padding: 12,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12, color: 'white', fontSize: 13,
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
              <button onClick={handleInvite} disabled={sending} style={{
                width: '100%', padding: 12,
                background: sending ? 'rgba(255,255,255,0.08)' : 'rgba(232,97,74,0.2)',
                border: '1px solid rgba(232,97,74,0.3)',
                borderRadius: 12, color: '#f4a493', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                {sending ? '📨 Sending...' : '📧 Send Invite Email'}
              </button>

              <button onClick={() => setScreen('friend-circle')} style={{
                width: '100%', padding: 12,
                background: 'rgba(159,225,203,0.15)',
                border: '1px solid rgba(159,225,203,0.3)',
                borderRadius: 12, color: '#9fe1cb', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                💬 Open My Circle Chat →
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>ENTER CIRCLE CODE</div>
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            maxLength={6}
            style={{
              width: '100%', padding: 14,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, color: 'white', fontSize: 18,
              letterSpacing: 6, textAlign: 'center',
              outline: 'none', fontFamily: 'inherit', fontWeight: 600
            }}
          />
          <button onClick={handleJoin} style={{
            width: '100%', padding: 14,
            background: 'linear-gradient(135deg, #e8614a, #c8b8e8)',
            border: 'none', borderRadius: 12,
            color: 'white', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            🔑 Join Circle
          </button>
        </div>
      )}

      {message && (
        <div style={{
          width: '100%', padding: 12, borderRadius: 10, textAlign: 'center',
          background: messageType === 'success' ? 'rgba(93,202,165,0.15)' : 'rgba(232,97,74,0.15)',
          border: `1px solid ${messageType === 'success' ? 'rgba(93,202,165,0.3)' : 'rgba(232,97,74,0.3)'}`,
          color: messageType === 'success' ? '#9fe1cb' : '#f4a493',
          fontSize: 13, lineHeight: 1.6
        }}>
          {message}
        </div>
      )}

      <button className="cancel-btn" style={{ color: 'rgba(255,255,255,0.5)' }} onClick={() => setScreen('circle')}>
        ← Back
      </button>
    </div>
  );
}