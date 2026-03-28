import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, orderBy, query, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function CircleScreen({ setScreen, sisterContact }) {
  const [posts, setPosts] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});

  const tagEmojis = { Family:'🌼', Career:'🌙', Identity:'🌿', Relationships:'🌸', 'Mental Health':'💜' };
  const tagColors = {
    Family:'rgba(244,164,147,0.2)', Career:'rgba(200,184,232,0.2)',
    Identity:'rgba(93,202,165,0.2)', Relationships:'rgba(232,97,74,0.2)',
    'Mental Health':'rgba(147,164,244,0.2)'
  };
  const tagClasses = {
    Family:'lc-family', Career:'lc-career', Identity:'lc-identity',
    Relationships:'lc-family', 'Mental Health':'lc-career'
  };

  const samplePosts = [
    { id:'s1', emoji:'🌼', tag:'Family', tagClass:'lc-family', color:'rgba(244,164,147,0.2)',
      text:'I don\'t know how to tell my parents I don\'t want the rishta they found. I feel so alone…',
      time:'2 hours ago', replies:[] },
    { id:'s2', emoji:'🌙', tag:'Career', tagClass:'lc-career', color:'rgba(200,184,232,0.2)',
      text:'I got the internship but my manager keeps talking over me in meetings. Is this imposter syndrome?',
      time:'5 hours ago', replies:[] },
    { id:'s3', emoji:'🌿', tag:'Identity', tagClass:'lc-identity', color:'rgba(93,202,165,0.2)',
      text:'I feel like I\'m two different people — one for home, one for college. When do I get to just be me?',
      time:'Yesterday', replies:[] },
  ];

  useEffect(() => {
    try {
      const q = query(collection(db, 'circlePosts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: new Date(doc.data().createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
          replies: doc.data().replies || []
        }));
        setPosts(fetchedPosts);
      });
      return () => unsubscribe();
    } catch(e) {
      console.log('Firebase error:', e);
    }
  }, []);

  const handleReply = async (postId, isSample) => {
    const replyText = replyTexts[postId];
    if (!replyText?.trim()) return;

    if (!isSample) {
      try {
        const postRef = doc(db, 'circlePosts', postId);
        const postDoc = await getDoc(postRef);
        const existingReplies = postDoc.data()?.replies || [];
        await updateDoc(postRef, {
          replies: [...existingReplies, {
            text: replyText.trim(),
            time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
          }]
        });
      } catch(e) { console.log('Reply error:', e); }
    }
    setReplyTexts(prev => ({ ...prev, [postId]: 'SENT' }));
  };

  const allPosts = [...posts, ...samplePosts];

  return (
    <div className="screen">
      <div className="circle-header">
        <div className="circle-icon">🌸</div>
        <div className="circle-title">SisterCircle</div>
        <div className="circle-sub">anonymous voices, shared hearts</div>
      </div>

      <button onClick={() => setScreen('sister-access')} style={{
        width:'100%', background:'rgba(232,97,74,0.15)',
        border:'1px solid rgba(232,97,74,0.3)', borderRadius:16,
        padding:14, display:'flex', alignItems:'center',
        justifyContent:'space-between', cursor:'pointer', marginBottom:8
      }}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <span style={{fontSize:24}}>👭</span>
          <div style={{textAlign:'left'}}>
            <div style={{color:'white', fontSize:14, fontWeight:500}}>Invite a Sister</div>
            <div style={{color:'rgba(255,255,255,0.5)', fontSize:11}}>
              {sisterContact ? `Shared with: ${sisterContact}` : 'No one has access yet'}
            </div>
          </div>
        </div>
        <span style={{color:'#e8614a', fontSize:20}}>→</span>
      </button>

      <div className="letters">
        {allPosts.map((l, i) => (
          <div key={l.id || i} className="letter-card">
            <div className="letter-top">
              <div className="letter-avatar" style={{background: l.color || 'rgba(244,164,147,0.2)'}}>
                {l.emoji || tagEmojis[l.tag] || '🌼'}
              </div>
              <div className="letter-meta">
                <div className="letter-anon">Anonymous Sister</div>
                <div className="letter-time">{l.time}</div>
              </div>
              <div className={`letter-chip ${l.tagClass || tagClasses[l.tag] || 'lc-family'}`}>
                {l.tag}
              </div>
            </div>

            <div className="letter-preview">"{l.text}"</div>

            {l.replies && l.replies.length > 0 && (
              <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:6}}>
                {l.replies.map((r, ri) => (
                  <div key={ri} style={{
                    background:'rgba(200,184,232,0.08)',
                    border:'1px solid rgba(200,184,232,0.2)',
                    borderRadius:10, padding:'8px 12px',
                    fontSize:12, color:'rgba(255,255,255,0.7)'
                  }}>
                    💬 {r.text}
                    <span style={{color:'rgba(255,255,255,0.3)', fontSize:10, marginLeft:8}}>{r.time}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{marginTop:10}}>
              {replyTexts[l.id || i] === 'SENT' ? (
                <div style={{
                  padding:12, borderRadius:10, textAlign:'center',
                  background:'rgba(93,202,165,0.15)',
                  border:'1px solid rgba(93,202,165,0.3)',
                  color:'#9fe1cb', fontSize:13
                }}>
                  💬 Message sent!! You made someone feel less alone 🌸
                </div>
              ) : (
                <>
                  <textarea
                    value={replyTexts[l.id || i] || ''}
                    onChange={e => setReplyTexts(prev => ({...prev, [l.id || i]: e.target.value}))}
                    placeholder="Write a kind response..."
                    style={{
                      width:'100%', minHeight:55, padding:10,
                      borderRadius:10, border:'1px solid rgba(255,255,255,0.12)',
                      background:'rgba(255,255,255,0.05)', color:'white',
                      fontSize:12, resize:'none', outline:'none',
                      fontFamily:'inherit'
                    }}
                  />
                  <button
                    onClick={() => handleReply(l.id || i, String(l.id).startsWith('s'))}
                    style={{
                      marginTop:6, width:'100%', padding:'10px',
                      borderRadius:10, border:'none', background:'#e8614a',
                      color:'white', fontSize:12, cursor:'pointer',
                      fontFamily:'inherit'
                    }}
                  >
                    💬 Send Support
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}