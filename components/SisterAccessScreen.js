import { useState } from 'react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_60gixls';
const EMAILJS_TEMPLATE_ID = 'template_9te5mfr';
const EMAILJS_PUBLIC_KEY = 'AGfknQmPBI3UZBW97';

export default function SisterAccessScreen({ setScreen, sisterContact, saveSisterContact }) {
  const [contactInput, setContactInput] = useState(sisterContact || '');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [sending, setSending] = useState(false);

  const handleSaveContact = async () => {
    const input = contactInput.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(input)) {
      setMessageType('error');
      setMessage('Please enter a valid email address!!');
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: input,
          to_name: 'Sister',
          from_name: 'Unmute',
          message: 'You have been invited to join a SisterCircle on Unmute — a safe, judgment-free space for women to speak their truth.',
          reply_to: input,
        },
        EMAILJS_PUBLIC_KEY
      );

      saveSisterContact(input);
      setMessageType('success');
      setMessage('✨ Invitation sent!! They will receive an email shortly 💛');
      setTimeout(() => setScreen('circle'), 2500);

    } catch(err) {
      console.error('EmailJS error:', err);
      setMessageType('error');
      setMessage('Something went wrong!! Please try again.');
    }
    setSending(false);
  };

  return (
    <div className="screen">
      <div className="circle-header">
        <div className="circle-icon">👭</div>
        <div className="circle-title">Invite a Sister</div>
        <div className="circle-sub">invite someone you trust to your circle</div>
      </div>

      <div style={{
        width:'100%', background:'rgba(255,255,255,0.06)',
        borderRadius:20, padding:24, marginTop:20
      }}>
        <div style={{textAlign:'center', marginBottom:20}}>
          <div style={{fontSize:48, marginBottom:12}}>💛</div>
          <div style={{color:'white', fontSize:16, fontWeight:500, marginBottom:8}}>
            Give Access to Your Sister
          </div>
          <div style={{color:'rgba(255,255,255,0.5)', fontSize:13, lineHeight:1.6}}>
            They'll receive an email invitation to join your safe space
          </div>
        </div>

        <input
          type="email"
          value={contactInput}
          onChange={(e) => setContactInput(e.target.value)}
          placeholder="Enter their email address"
          style={{
            width:'100%', padding:14,
            background:'rgba(255,255,255,0.08)',
            border:'1px solid rgba(255,255,255,0.15)',
            borderRadius:12, color:'white', fontSize:14,
            marginBottom:16, outline:'none',
            fontFamily:'inherit'
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveContact()}
        />

        <button
          onClick={handleSaveContact}
          disabled={sending}
          style={{
            width:'100%', padding:14,
            background: sending ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e8614a, #c8b8e8)',
            border:'none', borderRadius:12,
            color:'white', fontSize:14, fontWeight:600,
            cursor: sending ? 'not-allowed' : 'pointer',
            transition:'transform 0.2s', fontFamily:'inherit'
          }}
        >
          {sending ? '📨 Sending invitation...' : '💛 Send Invitation'}
        </button>

        {message && (
          <div style={{
            marginTop:16, padding:12, borderRadius:10,
            background: messageType==='success' ? 'rgba(93,202,165,0.15)' : 'rgba(232,97,74,0.15)',
            border: `1px solid ${messageType==='success' ? 'rgba(93,202,165,0.3)' : 'rgba(232,97,74,0.3)'}`,
            color: messageType==='success' ? '#9fe1cb' : '#f4a493',
            fontSize:13, textAlign:'center', lineHeight:1.6
          }}>
            {message}
          </div>
        )}

        {sisterContact && (
          <div style={{
            marginTop:20, padding:12, borderRadius:10,
            background:'rgba(200,184,232,0.1)',
            border:'1px solid rgba(200,184,232,0.2)',
            fontSize:12, color:'rgba(255,255,255,0.6)', textAlign:'center'
          }}>
            🌸 Currently shared with: <strong style={{color:'#c8b8e8'}}>{sisterContact}</strong>
          </div>
        )}
      </div>

      <button
        className="cancel-btn"
        style={{marginTop:20, color:'rgba(255,255,255,0.5)'}}
        onClick={() => setScreen('circle')}
      >
        ← Back to SisterCircle
      </button>
    </div>
  );
}