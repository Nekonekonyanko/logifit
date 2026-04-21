'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';

const workoutPlan: Record<number, { name: string; sets: number; reps: string }[]> = {
  1: [
    { name: 'Stomach', sets: 3, reps: '20 Reps' },
    { name: 'Reverse Crunch', sets: 3, reps: '15 Reps' },
    { name: 'Crunch Machine', sets: 3, reps: '25 Reps' },
  ],
  2: [
    { name: 'Air Bikes', sets: 3, reps: '20 Reps' },
    { name: 'Arm Pulley', sets: 3, reps: '20 Reps' },
    { name: 'Heel Touches', sets: 3, reps: '20 Reps' },
  ],
  3: [
    { name: 'Crunches', sets: 3, reps: '10 Reps' },
    { name: 'Plank', sets: 3, reps: '30 Reps' },
    { name: 'Side Crunches', sets: 3, reps: '30 Reps' },
  ],
  4: [
    { name: 'Leg Raise', sets: 3, reps: '20 Reps' },
    { name: 'Pikes', sets: 3, reps: '20 Reps' },
    { name: 'Cable Crunches', sets: 3, reps: '20 Reps' },
  ],
  5: [
    { name: 'Leg Raise', sets: 3, reps: '40 Reps' },
    { name: 'Pikes', sets: 3, reps: '10 Reps' },
    { name: 'Cable Crunches', sets: 3, reps: '10 Reps' },
  ],
  6: [
    { name: 'Stomach', sets: 3, reps: '20 Reps' },
    { name: 'Heel Touches', sets: 3, reps: '20 Reps' },
    { name: 'Crunches', sets: 3, reps: '10 Reps' },
  ],
  0: [
    { name: 'Leg Raise', sets: 3, reps: '20 Reps' },
    { name: 'Crunches', sets: 3, reps: '10 Reps' },
    { name: 'Pikes', sets: 3, reps: '10 Reps' },
  ],
};

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

const workoutTimes = ['30分', '1時間', '1時間半', '2時間'];

function LogContent() {
  const params = useSearchParams();
  const date = params.get("date");

  const dayOfWeek = date
    ? (() => { const [y, m, d] = date.split('-').map(Number); return new Date(y, m - 1, d).getDay(); })()
    : new Date().getDay();

  const menu = workoutPlan[dayOfWeek] ?? [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const [checked, setChecked] = useState<boolean[]>(menu.map(() => false));
  const [workoutTime, setWorkoutTime] = useState<string | null>(null);
  const [progTime, setProgTime] = useState('');
  const [progContent, setProgContent] = useState('');
  const [progMemo, setProgMemo] = useState('');
  const [engTime, setEngTime] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!date) { setLoading(false); return; }
  const fetchLog = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .eq('date', date)
      .single();

    if (data) {
      setMood(data.mood ?? null);
      setProgTime(data.prog_time?.toString() ?? '');
      setProgContent(data.prog_content ?? '');
      setProgMemo(data.prog_memo ?? '');
      setEngTime(data.eng_time?.toString() ?? '');
      setWorkoutTime(data.workout_time ?? null);
      if (data.gym_menu) {
        setChecked(data.gym_menu.map((ex: any) => ex.done ?? false));
      }
    }
    setLoading(false);
  };
  fetchLog();
}, [date]);

  const allDone = checked.length > 0 && checked.every(Boolean);
  const toggle = (i: number) => setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));

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
      gym: allDone,
      workout_time: workoutTime,
      gym_menu: menu.map((ex, i) => ({ ...ex, done: checked[i] })),
    };

    const { error } = await supabase
      .from('logs')
      .upsert(data, { onConflict: 'date' });

    if (error) {
      alert('保存に失敗しました: ' + error.message);
    } else {
      localStorage.setItem(date, JSON.stringify({
        gym: allDone,
        workoutTime,
        gymMenu: menu.map((ex, i) => ({ ...ex, done: checked[i] })),
        programming: { time: progTime, content: progContent, memo: progMemo },
        english: { time: engTime },
        mood,
      }));
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
                <div style={{ opacity: mood === m.value ? 1 : 0.4, transition: 'opacity 0.2s' }}>{m.svg}</div>
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
              <input type="number" value={progTime} onChange={e => setProgTime(e.target.value)} placeholder="例: 2" style={{ ...inputStyle, border: '1.5px solid #ffc0d8' }} />
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
          <label style={{ fontSize: 12, color: '#b8860b', fontWeight: 600, display: 'block', marginBottom: 4 }}>学習時間（時間）</label>
          <input type="number" value={engTime} onChange={e => setEngTime(e.target.value)} placeholder="例: 1"
            style={{ ...inputStyle, border: '1.5px solid #fce0a0' }} />
        </div>

        {/* Workout */}
        <div style={{ background: '#e7f8f5', borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, background: '#00d0ca', borderRadius: 4 }}></div>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#00a89e', letterSpacing: 1.5, textTransform: 'uppercase' }}>Workout</h2>
          </div>
          <p style={{ fontSize: 12, color: '#00a89e', fontWeight: 600, marginBottom: 8 }}>運動時間</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {workoutTimes.map(t => (
              <button key={t} onClick={() => setWorkoutTime(t)} style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: workoutTime === t ? '2px solid #00d0ca' : '2px solid #c0ede9',
                background: workoutTime === t ? '#00d0ca' : 'white',
                color: workoutTime === t ? 'white' : '#00a89e',
                transition: 'all 0.2s',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {menu.map((ex, i) => (
              <div key={i} onClick={() => toggle(i)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: checked[i] ? '#b2f0ec' : 'white',
                borderRadius: 12, padding: '12px 16px', cursor: 'pointer',
                border: `1.5px solid ${checked[i] ? '#00d0ca' : '#c0ede9'}`,
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: checked[i] ? '#007a76' : '#2d3748', textDecoration: checked[i] ? 'line-through' : 'none' }}>
                  {checked[i] ? '✅ ' : '⬜ '}{ex.name}
                </span>
                <span style={{ fontSize: 13, color: '#6b8fa3' }}>{ex.sets} × {ex.reps}</span>
              </div>
            ))}
          </div>
          {allDone && (
            <div style={{ marginTop: 12, background: '#00d0ca', color: 'white', borderRadius: 12, padding: 10, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
              🎉 全メニュー完了！
            </div>
          )}
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

export default function LogPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LogContent />
    </Suspense>
  );
}