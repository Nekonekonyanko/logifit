"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ChevronLeft, ChevronRight, Dumbbell, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EnglishIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fece5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="16" rx="2"/>
    <path d="M8 8h8M8 12h5"/>
  </svg>
);

const ProgrammingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7ea4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

export default function DailyLogApp() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const [curr, setCurr] = useState(() => new Date());
  const [logs, setLogs] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [aiComment, setAiComment] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const year = curr.getFullYear();
  const month = curr.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevDays = new Date(year, month, 0).getDate();

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
  .from('logs')
  .select('*');

      if (!error && data) {
        const loaded: Record<string, any> = {};
        data.filter((row: any) => {
  const [y, m] = row.date.split('-').map(Number);
  return y === year && m === month + 1;
}).forEach((row: any) => {
  loaded[row.date] = {
            gym: row.gym,
            workoutTime: row.workout_time,
            programming: { time: row.prog_time, content: row.prog_content, memo: row.prog_memo },
            english: { time: row.eng_time, content: row.eng_content },
weight: row.weight,
bodyFat: row.body_fat,
            mood: row.mood,
            alcohol: row.alcohol,
          };
        });
        setLogs(loaded);
      }
    };
    fetchLogs();
    setSelectedDate(null);
    setAiComment('');
  }, [year, month, daysInMonth]);

  const changeMonth = (diff: number) => {
    const next = new Date(year, month + diff, 1);
    setCurr(next);
  };

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true });
  const lastRowStart = cells.length % 7;
  if (lastRowStart !== 0) {
    const fillCount = 7 - lastRowStart;
    for (let i = 1; i <= fillCount; i++) cells.push({ day: i, current: false });
  }

  const totalProgTime = Object.values(logs).reduce((acc, l) => acc + (parseFloat(l?.programming?.time) || 0), 0);
  const totalEngTime = Object.values(logs).reduce((acc, l) => acc + (parseFloat(l?.english?.time) || 0), 0);
  const totalGymDays = Object.values(logs).filter(l => l?.gym).length;
  const totalGymTime = Object.values(logs).reduce((acc, l) => {
    if (!l?.workoutTime) return acc;
    const map: Record<string, number> = { '30分': 0.5, '1時間': 1, '1時間半': 1.5, '2時間': 2 };
    return acc + (map[l.workoutTime] ?? 0);
  }, 0);

  const generateAiComment = async (log: any, date: string) => {
    setAiLoading(true);
    setAiComment('');
    try {
      const HEIGHT = 159;
const bmi = log.weight ? (log.weight / ((HEIGHT / 100) ** 2)).toFixed(1) : null;

const summary = `
日付: ${date}
気分: ${log.mood ?? 'なし'}
プログラミング学習: ${log.programming?.time ?? 0}時間、内容: ${log.programming?.content ?? 'なし'}
英語学習: ${log.english?.time ?? 0}時間、内容: ${log.english?.content ?? 'なし'}
ジム: ${log.gym ? '完了' : '未完了'}、運動時間: ${log.workoutTime ?? 'なし'}
お酒: ${log.alcohol ? '飲んだ' : '飲まなかった'}
身長: ${HEIGHT}cm、体重: ${log.weight ?? 'なし'}kg、体脂肪率: ${log.bodyFat ?? 'なし'}%、BMI: ${bmi ?? '計算不可'}
`.trim();

      const res = await fetch('/api/ai-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      const data = await res.json();
      setAiComment(data.comment ?? '');
    } catch {
      setAiComment('コメントを取得できませんでした。');
    }
    setAiLoading(false);
  };

   const handleDateClick = (key: string) => {
  setSelectedDate(key);

  const log = logs[key];

  if (log) generateAiComment(log, key);
  else setAiComment('');
};

  const selectedLog = selectedDate ? logs[selectedDate] : null;
  const selectedDayOfWeek = selectedDate
    ? (() => { const [y, m, d] = selectedDate.split('-').map(Number); return new Date(y, m - 1, d).getDay(); })()
    : 0;

  const cellHeight = isMobile ? 52 : 110;
  const headerFontSize = isMobile ? 28 : 56;
  const padding = isMobile ? '16px' : '32px';
  const today = new Date();

  return (
    <div style={{ background: '#daedf6', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />

      <div style={{ background: 'white', padding: `24px ${padding} 28px`, borderBottom: '1.5px solid #1a1a2e' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: headerFontSize, fontWeight: 800, color: '#1a1a2e', letterSpacing: -1, lineHeight: 1 }}>
            {monthNames[month]} <span style={{ color: '#6bb8d4' }}>{year}</span>
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => changeMonth(-1)} style={{ padding: isMobile ? 8 : 10, background: 'white', border: '1.5px solid #1a1a2e', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
              <ChevronLeft size={isMobile ? 16 : 20} />
            </button>
            <button onClick={() => changeMonth(1)} style={{ padding: isMobile ? 8 : 10, background: 'white', border: '1.5px solid #1a1a2e', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
              <ChevronRight size={isMobile ? 16 : 20} />
            </button>
            {session ? (
              <button onClick={() => signOut()} style={{
                padding: '8px 14px', background: '#1a1a2e', color: 'white',
                border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>ログアウト</button>
            ) : (
              <button onClick={() => signIn('google')} style={{
                padding: '8px 14px', background: '#daedf6', color: '#1a1a2e',
                border: '1.5px solid #1a1a2e', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>ログイン</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: `16px ${padding}` }}>
        <div style={{ border: '1.5px solid #1a1a2e', borderRadius: isMobile ? 12 : 20, overflow: 'hidden', background: '#daedf6', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1.5px solid #1a1a2e' }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', padding: isMobile ? '8px 0' : '12px 0', fontSize: isMobile ? 10 : 12, fontWeight: 700, color: '#6b8fa3', letterSpacing: isMobile ? 0 : 2 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((cell, i) => {
              const key = cell.current ? `${year}-${month + 1}-${cell.day}` : `other-${i}`;
              const log = logs[key];
              const isLastRow = i >= cells.length - 7;
              const isLastCol = (i + 1) % 7 === 0;
              const isSelected = selectedDate === key;
              const isToday = cell.current &&
                cell.day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              return (
                <div
                  key={i}
                  onClick={() => cell.current && handleDateClick(key)}
                  style={{
                    background: isSelected ? '#b8dff0' : isToday ? '#f0f9f8' : 'white',
                    minHeight: cellHeight,
                    padding: isMobile ? '6px 4px' : '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: cell.current ? 'pointer' : 'default',
                    borderRight: isLastCol ? 'none' : '1px solid #c8dde8',
                    borderBottom: isLastRow ? 'none' : '1px solid #c8dde8',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{
                    fontSize: isMobile ? 11 : 14,
                    fontWeight: isToday ? 800 : 700,
                    alignSelf: 'flex-end',
                    color: isToday ? '#00d0ca' : cell.current ? '#1a1a2e' : '#c0cdd5'
                  }}>
                    {cell.day}
                  </span>
                  {cell.current && !isMobile && (
                    <div style={{ marginTop: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {log?.programming?.time && <ProgrammingIcon />}
                      {log?.english?.time && <EnglishIcon />}
                      {log?.gym && <Dumbbell size={12} color="#00d0ca" />}
                      {log?.alcohol && <img src="/beer.png" width={12} height={12} alt="beer" />}
                    </div>
                  )}
                  {cell.current && isMobile && (
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 2 }}>
                      {log?.programming?.time && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff7ea4' }} />}
                      {log?.english?.time && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fece5b' }} />}
                      {log?.gym && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d0ca' }} />}
                      {log?.alcohol && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffa000' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ border: '1.5px solid #1a1a2e', borderRadius: 20, background: 'white', padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#6b8fa3', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
              {monthNames[month]} Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: <ProgrammingIcon />, label: 'プログラミング', days: Object.values(logs).filter(l => l?.programming?.time).length, hours: totalProgTime, color: '#ff7ea4' },
                { icon: <EnglishIcon />, label: '英語', days: Object.values(logs).filter(l => l?.english?.time).length, hours: totalEngTime, color: '#fece5b' },
                { icon: <Dumbbell size={14} color="#00d0ca" />, label: 'ジム', days: totalGymDays, hours: totalGymTime, color: '#00d0ca' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item.icon}
                  <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500, minWidth: 90 }}>{item.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: item.color }}>
                    {item.days}日 / {item.hours}時間
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '1.5px solid #1a1a2e', borderRadius: 20, background: 'white', padding: 24 }}>
            {selectedDate && selectedLog ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#6b8fa3', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {selectedDate} ({fullDayNames[selectedDayOfWeek]})
                  </h3>
                  {isAdmin && (
                    <button onClick={() => router.push(`/log?date=${selectedDate}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#6b8fa3', fontSize: 12 }}>
                      <ExternalLink size={14} /> 記録を編集
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  {selectedLog.mood && <div>気分: <strong>{selectedLog.mood}</strong></div>}
                  {selectedLog.programming?.time && <div style={{ color: '#ff7ea4' }}>💻 プログラミング {selectedLog.programming.time}h — {selectedLog.programming.content}</div>}
                  {selectedLog.english?.time && <div style={{ color: '#d4a017' }}>📚 英語 {selectedLog.english.time}h</div>}
                  {selectedLog.workoutTime && <div style={{ color: '#00a89e' }}>💪 運動 {selectedLog.workoutTime}</div>}
                  {selectedLog.alcohol && <div style={{ color: '#ffa000' }}>🍺 飲んだ</div>}
                </div>
              </>
            ) : selectedDate ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#6b8fa3', letterSpacing: 1.5, textTransform: 'uppercase' }}>{selectedDate}</h3>
                  {isAdmin && (
                    <button onClick={() => router.push(`/log?date=${selectedDate}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#6bb8d4', fontSize: 12, fontWeight: 600 }}>
                      <ExternalLink size={14} /> 記録を追加
                    </button>
                  )}
                </div>
                <p style={{ color: '#c0cdd5', fontSize: 13 }}>まだ記録がありません</p>
              </>
            ) : (
              <p style={{ color: '#c0cdd5', fontSize: 13, marginTop: 8 }}>日付をクリックして記録を確認</p>
            )}
          </div>
        </div>

        {selectedDate && (
          <div style={{ border: '1.5px solid #1a1a2e', borderRadius: 20, background: '#1a1a2e', padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#6bb8d4', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>AI Coach</h3>
            {aiLoading ? (
              <p style={{ color: '#6b8fa3', fontSize: 14, fontStyle: 'italic' }}>コメントを生成中...</p>
            ) : aiComment ? (
              <p style={{ color: 'white', fontSize: 14, lineHeight: 1.8 }}>{aiComment}</p>
            ) : (
              <p style={{ color: '#6b8fa3', fontSize: 14, fontStyle: 'italic' }}>記録のある日をクリックするとコメントが表示されます</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}