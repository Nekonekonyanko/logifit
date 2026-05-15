'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';

const moods = [
  { label: 'Great', value: 'Great',
    svg: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="#1a1a2e" strokeWidth="1.8"/><circle cx="13" cy="15" r="1.8" fill="#1a1a2e"/><circle cx="23" cy="15" r="1.8" fill="#1a1a2e"/><path d="M11 21c1.5 3.5 12.5 3.5 14 0" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round"/></svg>
  },
  { label: 'Good', value: 'Good',
    svg: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="#1a1a2e" strokeWidth="1.8"/><circle cx="13" cy="15" r="1.8" fill="#1a1a2e"/><circle cx="23" cy="15" r="1.8" fill="#1a1a2e"/><path d="M12 21c1.5 2.5 10.5 2.5 12 0" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round"/></svg>
  },
  { label: 'Okay', value: 'Okay',
    svg: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="#1a1a2e" strokeWidth="1.8"/><circle cx="13" cy="15" r="1.8" fill="#1a1a2e"/><circle cx="23" cy="15" r="1.8" fill="#1a1a2e"/><line x1="12" y1="22" x2="24" y2="22" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round"/></svg>
  },
  { label: 'Bad', value: 'Bad',
    svg: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="#1a1a2e" strokeWidth="1.8"/><circle cx="13" cy="15" r="1.8" fill="#1a1a2e"/><circle cx="23" cy="15" r="1.8" fill="#1a1a2e"/><path d="M12 24c1.5-2.5 10.5-2.5 12 0" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round"/></svg>
  },
  { label: 'Awful', value: 'Awful',
    svg: <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="#1a1a2e" strokeWidth="1.8"/><circle cx="13" cy="15" r="1.8" fill="#1a1a2e"/><circle cx="23" cy="15" r="1.8" fill="#1a1a2e"/><path d="M11 25c1.5-3.5 12.5-3.5 14 0" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round"/></svg>
  },
];

const bodyParts = ['Legs', 'Back', 'Chest', 'Shoulders', 'Arms', 'Core'];

const workoutTypes = [
  { id: 'workout', label: 'Workout', hasParts: true },
  { id: 'stretch', label: 'Stretch', hasParts: true },
  { id: 'pool', label: 'プール', hasParts: false,
    options: [{ label: '距離', key: 'distance', choices: ['0.5km', '1km', '1.5km', '2km', '2.5km', '3km'] }] },
  { id: 'walking', label: 'ウォーキング', hasParts: false,
    options: [
      { label: '傾斜', key: 'incline', choices: ['0度', '3度', '5度', '7度', '10度', '12度', '15度'] },
      { label: '時間', key: 'duration', choices: ['10分', '20分', '30分', '40分', '50分', '60分', '90分'] },
      { label: '距離', key: 'distance', choices: ['1km', '2km', '3km', '4km', '5km', '6km', '7km', '8km', '10km'] },
    ]},
  { id: 'running', label: 'ランニング', hasParts: false,
    options: [
      { label: '時間', key: 'duration', choices: ['10分', '20分', '30分', '40分', '50分', '60分', '90分'] },
      { label: '距離', key: 'distance', choices: ['1km', '2km', '3km', '4km', '5km', '6km', '7km', '8km', '10km'] },
    ]},
  { id: 'yoga', label: 'ヨガ', hasParts: false,
    options: [{ label: '時間', key: 'duration', choices: ['10分', '20分', '30分', '40分', '50分', '60分', '90分'] }]},
  { id: 'spa', label: 'スパ', hasParts: false, options: [] },
];

const workoutTimes = ['30分', '1時間', '1時間半', '2時間'];

function LogContent() {
  const params = useSearchParams();
  const date = params.get("date");
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = date
    ? (() => { const [y, m, d] = date.split('-').map(Number); return new Date(y, m - 1, d).getDay(); })()
    : new Date().getDay();

  const [progTime, setProgTime] = useState('');
  const [progContent, setProgContent] = useState('');
  const [progMemo, setProgMemo] = useState('');
  const [engTime, setEngTime] = useState('');
  const [engContent, setEngContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workoutTime, setWorkoutTime] = useState<string | null>(null);
  const [alcohol, setAlcohol] = useState(false);
  const [weight, setWeight] = useState('53.0');
  const [bodyFat, setBodyFat] = useState('30.0');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<Record<string, string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (!date) { setLoading(false); return; }
    const fetchLog = async () => {
      const { data } = await supabase.from('logs').select('*').eq('date', date).single();
      if (data) {
        setMood(data.mood ?? null);
        setProgTime(data.prog_time?.toString() ?? '');
        setProgContent(data.prog_content ?? '');
        setProgMemo(data.prog_memo ?? '');
        setEngTime(data.eng_time?.toString() ?? '');
        setEngContent(data.eng_content ?? '');
        setWorkoutTime(data.workout_time ?? null);
        setAlcohol(data.alcohol ?? false);
        setWeight(data.weight?.toString() ?? '');
        setBodyFat(data.body_fat?.toString() ?? '');
        if (data.workout_types) {
          setSelectedTypes(data.workout_types.types ?? []);
          setSelectedParts(data.workout_types.parts ?? {});
          setSelectedOptions(data.workout_types.options ?? {});
        }
      }
      setLoading(false);
    };
    fetchLog();
  }, [date]);

  const toggleType = (id: string) => {
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const togglePart = (typeId: string, part: string) => {
    setSelectedParts(prev => {
      const current = prev[typeId] ?? [];
      return {
        ...prev,
        [typeId]: current.includes(part) ? current.filter(p => p !== part) : [...current, part]
      };
    });
  };

  const setOption = (typeId: string, key: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [typeId]: { ...(prev[typeId] ?? {}), [key]: value }
    }));
  };

  const saveLog = async () => {
    if (!date) return;
    setSaving(true);
    const data = {
      date,
      mood,
      prog_time: progTime ? parseFloat(progTime) : null,
      prog_content: progContent || null,
      prog_memo: progMemo || null,
      eng_time: engTime ? parseFloat(engTime) : null,
      eng_content: engContent || null,
      gym: selectedTypes.length > 0,
      workout_time: workoutTime,
      workout_types: { types: selectedTypes, parts: selectedParts, options: selectedOptions },
      alcohol,
      weight: weight ? parseFloat(weight) : null,
      body_fat: bodyFat ? parseFloat(bodyFat) : null,
    };

    const res = await fetch('/api/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
const result = await res.json();
if (result.error) {
  alert('保存に失敗しました: ' + result.error);
} else {
  alert('保存したよ！');
}
setSaving(false);

  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: '1.5px solid #e0e0e0', background: 'white',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  };

  if (loading) return <div style={{ padding: 24, fontFamily: "'DM Sans', sans-serif" }}>読み込み中...</div>;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#daedf6', minHeight: '100vh', padding: '24px 16px' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>Daily Log</h1>
        <p style={{ color: '#6b8fa3', fontSize: 14, marginBottom: 24 }}>{date} — {dayNames[dayOfWeek]}</p>

        {/* Mood */}
        <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: '#6b8fa3', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Today's Mood</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {moods.map(m => (
              <button key={m.value} onClick={() => setMood(m.value)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: mood === m.value ? '#daedf6' : 'transparent',
                border: mood === m.value ? '2px solid #6bb8d4' : '2px solid transparent',
                borderRadius: 16, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <div style={{ opacity: mood === m.value ? 1 : 0.4 }}>{m.svg}</div>
                <span style={{ fontSize: 11, color: '#6b8fa3', fontWeight: 600 }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Programming */}
        <div style={{ background: '#ffeff7', borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, background: '#ff7ea4', borderRadius: 4 }}></div>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#ff7ea4', letterSpacing: 1.5, textTransform: 'uppercase' }}>Programming</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: '#c45c80', fontWeight: 600, display: 'block', marginBottom: 4 }}>学習時間（時間）</label>
              <input type="number" value={progTime} onChange={e => setProgTime(e.target.value)} placeholder="例: 2" min="0" style={{ ...inputStyle, border: '1.5px solid #ffc0d8' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#c45c80', fontWeight: 600, display: 'block', marginBottom: 4 }}>学習内容</label>
              <input type="text" value={progContent} onChange={e => setProgContent(e.target.value)} placeholder="例: Next.js App Router" style={{ ...inputStyle, border: '1.5px solid #ffc0d8' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#c45c80', fontWeight: 600, display: 'block', marginBottom: 4 }}>メモ</label>
              <textarea value={progMemo} onChange={e => setProgMemo(e.target.value)} placeholder="気づいたこと、次回やること..." rows={3}
                style={{ ...inputStyle, border: '1.5px solid #ffc0d8', resize: 'none' }} />
            </div>
          </div>
        </div>

        {/* English */}
        <div style={{ background: '#fcf2e5', borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, background: '#fece5b', borderRadius: 4 }}></div>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#d4a017', letterSpacing: 1.5, textTransform: 'uppercase' }}>English</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: '#b8860b', fontWeight: 600, display: 'block', marginBottom: 4 }}>学習時間（時間）</label>
              <input type="number" value={engTime} onChange={e => setEngTime(e.target.value)} placeholder="例: 1" min="0"
                style={{ ...inputStyle, border: '1.5px solid #fce0a0' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#b8860b', fontWeight: 600, display: 'block', marginBottom: 4 }}>学習内容</label>
              <input type="text" value={engContent} onChange={e => setEngContent(e.target.value)} placeholder="例: 単語・リスニング・スピーキング"
                style={{ ...inputStyle, border: '1.5px solid #fce0a0' }} />
            </div>
          </div>
        </div>

        {/* Workout */}
        <div style={{ background: '#e7f8f5', borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, background: '#00d0ca', borderRadius: 4 }}></div>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#00a89e', letterSpacing: 1.5, textTransform: 'uppercase' }}>Workout</h2>
          </div>
          <p style={{ fontSize: 12, color: '#00a89e', fontWeight: 600, marginBottom: 10 }}>今日は何をしますか？</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {workoutTypes.map(type => (
              <div key={type.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => toggleType(type.id)} style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: selectedTypes.includes(type.id) ? '2px solid #00d0ca' : '2px solid #c0ede9',
                    background: selectedTypes.includes(type.id) ? '#00d0ca' : 'white',
                    color: selectedTypes.includes(type.id) ? 'white' : '#00a89e',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}>{type.label}</button>

                  {type.hasParts && selectedTypes.includes(type.id) && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {bodyParts.map(part => (
                        <button key={part} onClick={() => togglePart(type.id, part)} style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: (selectedParts[type.id] ?? []).includes(part) ? '2px solid #00d0ca' : '2px solid #c0ede9',
                          background: (selectedParts[type.id] ?? []).includes(part) ? '#00d0ca' : 'white',
                          color: (selectedParts[type.id] ?? []).includes(part) ? 'white' : '#00a89e',
                          transition: 'all 0.2s',
                        }}>{part}</button>
                      ))}
                    </div>
                  )}
                </div>

                {!type.hasParts && type.options && type.options.length > 0 && selectedTypes.includes(type.id) && (
                  <div style={{ marginTop: 8, marginLeft: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {type.options.map(opt => (
                      <div key={opt.key}>
                        <label style={{ fontSize: 11, color: '#00a89e', fontWeight: 600, display: 'block', marginBottom: 4 }}>{opt.label}</label>
                        <select value={(selectedOptions[type.id] ?? {})[opt.key] ?? ''} onChange={e => setOption(type.id, opt.key, e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: 10, border: '1.5px solid #c0ede9', fontSize: 12, background: 'white', color: '#1a1a2e', outline: 'none' }}>
                          <option value="">選択</option>
                          {opt.choices.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedTypes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: '#00a89e', fontWeight: 600, marginBottom: 8 }}>運動時間</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {workoutTimes.map(t => (
                  <button key={t} onClick={() => setWorkoutTime(workoutTime === t ? null : t)} style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: workoutTime === t ? '2px solid #00d0ca' : '2px solid #c0ede9',
                    background: workoutTime === t ? '#00d0ca' : 'white',
                    color: workoutTime === t ? 'white' : '#00a89e',
                    transition: 'all 0.2s',
                  }}>{t}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, background: '#a78bfa', borderRadius: 4 }}></div>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', letterSpacing: 1.5, textTransform: 'uppercase' }}>Body</h2>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, display: 'block', marginBottom: 4 }}>体重（kg）</label>
              <input type="number" value={weight} onChange={e => setWeight(Math.max(0, parseFloat(e.target.value) || 0).toString())} placeholder="例: 55.5" min="0"
                style={{ ...inputStyle, border: '1.5px solid #ddd6fe' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, display: 'block', marginBottom: 4 }}>体脂肪率（%）</label>
              <input type="number" value={bodyFat} onChange={e => setBodyFat(Math.max(0, parseFloat(e.target.value) || 0).toString())} placeholder="例: 22.5" min="0"
                style={{ ...inputStyle, border: '1.5px solid #ddd6fe' }} />
            </div>
          </div>
        </div>

        {/* Alcohol */}
        <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: '#6b8fa3', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Alcohol</h2>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={() => setAlcohol(true)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: alcohol ? '#daedf6' : 'transparent',
              border: alcohol ? '2px solid #6bb8d4' : '2px solid transparent',
              borderRadius: 16, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <img src="/beer.png" width={36} height={36} alt="beer" style={{ opacity: alcohol ? 1 : 0.3 }} />
              <span style={{ fontSize: 11, color: '#6b8fa3', fontWeight: 600 }}>飲んだ</span>
            </button>
            <button onClick={() => setAlcohol(false)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: !alcohol ? '#daedf6' : 'transparent',
              border: !alcohol ? '2px solid #6bb8d4' : '2px solid transparent',
              borderRadius: 16, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <img src="/beer.png" width={36} height={36} alt="no beer" style={{ opacity: 0.2 }} />
                <svg style={{ position: 'absolute' }} width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <line x1="6" y1="6" x2="30" y2="30" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, color: '#6b8fa3', fontWeight: 600 }}>飲まなかった</span>
            </button>
          </div>
        </div>

        <button onClick={saveLog} disabled={saving} style={{
          width: '100%', padding: 16, borderRadius: 20, border: 'none',
          background: saving ? '#94a3b8' : '#1a1a2e', color: 'white', fontSize: 15, fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: 1, fontFamily: "'DM Sans', sans-serif", marginBottom: 12,
        }}>
          {saving ? '保存中...' : '保存'}
        </button>

        <button onClick={() => { window.location.href = '/'; }} style={{
          width: '100%', padding: 16, borderRadius: 20, border: '1.5px solid #1a1a2e',
          background: 'white', color: '#1a1a2e', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
        }}>
          ← カレンダーに戻る
        </button>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function LogPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LogContent />
    </Suspense>
  );
}