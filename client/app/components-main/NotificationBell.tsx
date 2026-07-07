'use client';
import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { notificationApi } from '../api-services/notificationApi';
import { useNotifications } from '../hooks/useNotifications';
import Link from 'next/link';

export default function NotificationBell() {
  // Works with AuthContext OR direct localStorage (matches navbar auth pattern)
  const ctx = useContext(AuthContext) as any;
  const token: string | null =
    ctx?.token ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('token') || localStorage.getItem('accessToken')
      : null);

  const { unreadCount, fetchUnread } = useNotifications(token);
  const [open, setOpen]             = useState(false);
  const [notifications, setNotifs]  = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await notificationApi.getAll(token);
      setNotifs(res.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) loadNotifications();
  };

  const markRead = async (id: string) => {
    await notificationApi.markRead(id, token);
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    fetchUnread();
  };

  const markAll = async () => {
    await notificationApi.markAllRead(token);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    fetchUnread();
  };

  if (!token) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 rounded-full hover:bg-gray-800 transition">
        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAll} className="text-xs text-purple-400 hover:underline">Mark all read</button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && <p className="text-center text-gray-500 py-8 text-sm">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">No notifications yet</p>
            )}
            {notifications.map(n => (
              <Link href={n.url || '/nearby'} key={n._id}
                onClick={() => markRead(n._id)}
                className={`flex gap-3 px-4 py-3 hover:bg-gray-800 transition border-b border-gray-800/50 ${!n.isRead ? 'bg-purple-900/20' : ''}`}>
                {n.image
                  ? <img src={`${process.env.NEXT_PUBLIC_API_URL}${n.image}`} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  : <div className="w-10 h-10 rounded bg-purple-700 flex items-center justify-center text-lg shrink-0">🏷️</div>
                }
                <div className="min-w-0">
                  <p className={`text-sm font-medium leading-tight ${!n.isRead ? 'text-white' : 'text-gray-300'}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-purple-500 rounded-full mt-1 shrink-0" />}
              </Link>
            ))}
          </div>

          <Link href="/nearby" onClick={() => setOpen(false)}
            className="block text-center text-purple-400 text-xs py-3 hover:bg-gray-800 transition border-t border-gray-800">
            View all nearby offers →
          </Link>
        </div>
      )}
    </div>
  );
}
