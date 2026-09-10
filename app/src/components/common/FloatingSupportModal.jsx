import React, { useState, useRef, useEffect } from 'react';
import { Headphones, X, Send, PhoneCall, Mail, BookOpen, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export function FloatingSupportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sent, setSent] = useState(false);
  const setToast = useAppStore((s) => s.setToast);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const modalRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setToast?.({ msg: 'Support request dispatched! Ticket #SPT-8942 generated.', type: 'success' });
    setTimeout(() => {
      setMessage('');
      setSubject('');
      setSent(false);
      setIsOpen(false);
    }, 1800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" ref={modalRef}>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-white/30 backdrop-blur-sm"
          aria-label="Need Help? Contact Support"
        >
          <div className="relative flex items-center justify-center">
            <Headphones size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-1 ring-white" />
          </div>
          <span className="text-xs font-bold tracking-wide">Need Help?</span>
        </button>
      )}

      {/* Support Popover Card */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-200 text-text">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Headphones size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text leading-tight">Help & Support</h3>
                <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Support team online
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-soft transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Contact Direct Channels */}
          <div className="grid grid-cols-2 gap-2 my-3">
            <a
              href="tel:+918004259000"
              className="p-2.5 rounded-xl border border-border bg-soft hover:border-primary/50 transition text-left group"
            >
              <PhoneCall size={14} className="text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] text-muted">Phone Direct</p>
              <p className="text-xs font-bold text-text truncate">+91 800 425 9000</p>
            </a>
            <a
              href="mailto:support@evenmore.io"
              className="p-2.5 rounded-xl border border-border bg-soft hover:border-primary/50 transition text-left group"
            >
              <Mail size={14} className="text-indigo-500 mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] text-muted">Email Desk</p>
              <p className="text-xs font-bold text-text truncate">support@evenmore.io</p>
            </a>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="flex-1 py-1.5 px-2 rounded-lg border border-border bg-card hover:bg-soft text-[11px] font-semibold text-text-secondary transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={13} className="text-blue-500" />
              <span>Search (Ctrl+K)</span>
            </button>
            <a
              href="/reports"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-1.5 px-2 rounded-lg border border-border bg-card hover:bg-soft text-[11px] font-semibold text-text-secondary transition flex items-center justify-center gap-1.5 text-center"
            >
              <BookOpen size={13} className="text-emerald-500" />
              <span>User Guides</span>
            </a>
          </div>

          {/* Quick Ticket Form */}
          {sent ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1 my-2">
              <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Request Received</p>
              <p className="text-[11px] text-muted">Ticket #SPT-8942 logged. We'll connect in ~15 mins.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <input
                  type="text"
                  placeholder="Subject / Issue topic..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-soft text-text placeholder:text-muted focus:outline-none focus:border-primary focus:bg-card transition"
                  required
                />
              </div>
              <div>
                <textarea
                  rows={2}
                  placeholder="Describe your question or difficulty..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-soft text-text placeholder:text-muted focus:outline-none focus:border-primary focus:bg-card transition resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Send size={13} />
                <span>Submit Ticket</span>
              </button>
            </form>
          )}

          {/* Operating Schedule */}
          <div className="pt-2.5 mt-2.5 border-t border-border flex items-center justify-between text-[10px] text-muted">
            <span className="flex items-center gap-1">
              <Clock size={11} /> Mon–Sat, 9 AM – 7 PM IST
            </span>
            <span className="font-semibold text-primary">Evenmore Cloud SLA</span>
          </div>
        </div>
      )}
    </div>
  );
}
