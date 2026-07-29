'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ScanLine, Plus, Trash2, X, Sparkles, ListChecks, Mic, MicOff,
  RefreshCw, AlertCircle, CheckCircle2, Upload, Store, Check, HelpCircle, Languages,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SupplierCompareModal from './SupplierCompareModal';
import {
  useSpeechRecognition, VOICE_LANGUAGES, VoiceLanguageOption,
} from '../../hooks/useSpeechRecognition';

interface BulkItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  needsClarification?: boolean;
}

type ScanStep = 'idle' | 'scanning' | 'done' | 'error';

let idCounter = 0;
const uid = () => `supitem-${++idCounter}-${Date.now()}`;

// ── Scan sub-modal (identical pattern to bulk-purchase's ScanModal) ─────────
function ScanModal({ onClose, onItems }: {
  onClose: () => void; onItems: (items: { name: string; quantity: string }[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [step, setStep] = useState<ScanStep>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const [count, setCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => { setFile(f); setPreview(URL.createObjectURL(f)); setStep('idle'); setErrMsg(''); };

  const handleScan = async () => {
    if (!file) return;
    setStep('scanning'); setErrMsg('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/smart-bulk-scan', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Scan failed.');
      setCount(data.items.length);
      setStep('done');
      onItems(data.items);
    } catch (err: any) {
      setErrMsg(err.message || 'Something went wrong.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-[#BBD5DA] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="border-b border-[#BBD5DA] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-teal-600" />
            <h2 className="text-base font-bold text-gray-900">Scan Stock Order List</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {step !== 'done' && (
            <div
              className={`border-2 border-dashed rounded-2xl transition cursor-pointer
                ${dragging ? 'border-teal-500 bg-teal-50' : 'border-[#BBD5DA] hover:border-teal-400 hover:bg-[#F5F5F5]'}
                ${preview ? 'p-2' : 'p-8'}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) pickFile(f); }}
              onClick={() => !preview && inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="List" className="w-full max-h-52 object-contain rounded-xl" />
                  <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(''); setStep('idle'); }}
                    className="absolute top-2 right-2 bg-white/90 border border-gray-200 rounded-full p-1 shadow">
                    <X size={13} className="text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#DFF1F1] flex items-center justify-center">
                    <Upload size={22} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Drop your stock order list here</p>
                    <p className="text-xs text-gray-400 mt-0.5">Handwritten or printed · Any Indian language</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'scanning' && (
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
              <RefreshCw size={16} className="text-teal-600 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-semibold text-teal-800">Reading list…</p>
                <p className="text-xs text-teal-600 mt-0.5">Extracting items using AI</p>
              </div>
            </div>
          )}
          {step === 'error' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errMsg}</p>
            </div>
          )}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={26} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{count} item{count !== 1 ? 's' : ''} found!</p>
                <p className="text-xs text-gray-500 mt-0.5">Review and edit your list below.</p>
              </div>
              <button onClick={onClose} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-sm font-semibold text-white transition">
                View List →
              </button>
            </div>
          )}

          {step !== 'done' && (
            <button onClick={handleScan} disabled={!file || step === 'scanning'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition">
              {step === 'scanning' ? <><RefreshCw size={14} className="animate-spin" /> Scanning…</> : <><Sparkles size={14} /> Scan & Extract Items</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main list builder modal ──────────────────────────────────────────────────
export default function SupplierListBuilderModal({
  supplierType, store, token, onClose,
}: {
  supplierType: 'whole_saler' | 'home_business';
  store: any; token: string; onClose: () => void;
}) {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [showScan, setShowScan] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<VoiceLanguageOption>(VOICE_LANGUAGES[0]);
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const addFromScan = (raw: { name: string; quantity: string }[]) => {
    const newItems: BulkItem[] = raw.map(r => ({ id: uid(), name: r.name, quantity: r.quantity, checked: false }));
    setItems(prev => [...prev, ...newItems]);
  };

  const addFromVoice = (raw: { name: string; quantity: string; needsClarification?: boolean }[]) => {
    const newItems: BulkItem[] = raw.map(r => ({ id: uid(), name: r.name, quantity: r.quantity, checked: false, needsClarification: r.needsClarification }));
    setItems(prev => [...prev, ...newItems]);
  };

  const handleVoiceResult = useCallback(async (text: string) => {
    setVoiceParsing(true); setVoiceError('');
    try {
      const res = await fetch('/api/voice-purchase-list', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang: voiceLang.short }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not understand that.');
      addFromVoice(data.items);
    } catch (err: any) {
      setVoiceError(err.message || 'Could not understand that.');
    } finally {
      setVoiceParsing(false);
    }
  }, [voiceLang]);

  const voice = useSpeechRecognition(handleVoiceResult);

  const addBlank = () => {
    const item: BulkItem = { id: uid(), name: '', quantity: '', checked: false };
    setItems(prev => [...prev, item]);
    setEditingId(item.id);
  };

  const update = (id: string, field: 'name' | 'quantity', value: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value, needsClarification: false } : i));

  const commitName = useCallback(async (id: string, value: string) => {
    setEditingId(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    setTranslatingId(id);
    try {
      const res = await fetch('/api/tanglish-translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (data.translated && data.translated !== trimmed) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, name: data.translated } : i));
      }
    } catch { /* keep original on error */ }
    finally { setTranslatingId(null); }
  }, []);

  const toggleCheck = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearAll = () => setItems([]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-[#BBD5DA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="px-6 py-4 border-b border-[#BBD5DA] bg-[#DFF1F1] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Build Stock Order List</h2>
            <p className="text-gray-500 text-xs mt-0.5">Scan, speak, or type what you need to restock</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">

          {/* Entry toolbar */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowScan(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-xl transition">
              <ScanLine size={12} /> Scan Paper List
            </button>
            <button onClick={addBlank}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 px-3 py-2 rounded-xl transition">
              <Plus size={12} /> Add Item
            </button>
          </div>

          {/* Voice entry */}
          <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {VOICE_LANGUAGES.map(l => (
                  <button key={l.code} type="button" onClick={() => setVoiceLang(l)} disabled={voice.listening || voiceParsing}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition disabled:opacity-50 ${
                      voiceLang.code === l.code ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-[#BBD5DA]'
                    }`}>
                    {l.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => (voice.listening ? voice.stop() : voice.start(voiceLang))}
                disabled={voiceParsing || !voice.supported}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 shrink-0 ${
                  voice.listening ? 'bg-[#FF0000] text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}>
                {voiceParsing ? <><RefreshCw size={14} className="animate-spin" /> Understanding…</>
                  : voice.listening ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Speak your list</>}
              </button>
            </div>
            {!voice.supported && <p className="text-xs text-gray-400">Voice input isn't supported in this browser — try Chrome or Edge.</p>}
            {voice.listening && <p className="text-xs text-teal-700">Listening… "{voice.interimTranscript || voice.transcript || '…'}"</p>}
            {(voice.error || voiceError) && <p className="text-xs text-[#FF0000] flex items-center gap-1"><AlertCircle size={11} />{voice.error || voiceError}</p>}
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div className="bg-[#F5F5F5] rounded-2xl border border-[#BBD5DA] p-8 text-center">
              <ListChecks size={36} className="text-[#BBD5DA] mx-auto mb-3" />
              <p className="font-semibold text-gray-700 text-sm mb-1">No items yet</p>
              <p className="text-xs text-gray-400">Scan a list, speak, or add items manually above</p>
            </div>
          )}

          {/* Items table */}
          {items.length > 0 && (
            <>
              <div className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden">
                <div className="grid grid-cols-[2rem_1fr_7rem_2.5rem] gap-2 px-4 py-2.5 bg-[#F5F5F5] border-b border-[#BBD5DA]">
                  <span />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</span>
                  <span />
                </div>

                <AnimatePresence initial={false}>
                  {items.map((item, idx) => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`grid grid-cols-[2rem_1fr_7rem_2.5rem] gap-2 items-center px-4 py-3
                        ${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}
                        ${item.checked ? 'opacity-50' : ''}
                        ${item.needsClarification ? 'bg-amber-50' : ''}
                        border-b border-[#BBD5DA] last:border-0`}>
                      <button onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition
                          ${item.checked ? 'bg-teal-600 border-teal-600' : 'border-gray-300 hover:border-teal-400'}`}>
                        {item.checked && <Check size={11} className="text-white" strokeWidth={3} />}
                      </button>

                      {editingId === item.id ? (
                        <div className="relative">
                          <input autoFocus value={item.name}
                            onChange={e => update(item.id, 'name', e.target.value)}
                            onBlur={e => commitName(item.id, e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitName(item.id, item.name); } }}
                            placeholder="Type in English or Tanglish…"
                            className="w-full bg-[#DFF1F1] border border-teal-300 rounded-lg px-2 py-1 text-sm outline-none pr-6" />
                          <Languages size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 pointer-events-none" />
                        </div>
                      ) : translatingId === item.id ? (
                        <div className="flex items-center gap-1.5 text-sm text-teal-600">
                          <RefreshCw size={12} className="animate-spin shrink-0" />
                          <span className="truncate italic text-xs">Translating…</span>
                        </div>
                      ) : (
                        <button onClick={() => setEditingId(item.id)}
                          className={`flex items-center gap-1.5 text-left text-sm font-medium text-gray-800 truncate hover:text-teal-700 transition
                              ${item.checked ? 'line-through text-gray-400' : ''}`}>
                          {item.needsClarification && <HelpCircle size={12} className="text-amber-500 shrink-0" />}
                          <span className="truncate">{item.name || <span className="text-gray-300 italic">tap to name</span>}</span>
                          {item.needsClarification && <span className="text-[10px] text-amber-600 font-semibold shrink-0">confirm?</span>}
                        </button>
                      )}

                      <input value={item.quantity} onChange={e => update(item.id, 'quantity', e.target.value)}
                        placeholder="e.g. 50 units"
                        className="w-full bg-transparent border border-transparent hover:border-[#BBD5DA] focus:border-teal-400 focus:bg-[#DFF1F1] rounded-lg px-2 py-1 text-sm text-teal-700 font-medium outline-none transition placeholder-gray-300" />

                      <button onClick={() => remove(item.id)}
                        className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition">
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1">
                  <Trash2 size={11} /> Clear all
                </button>
                <button
                  onClick={() => setShowCompare(true)}
                  disabled={items.every(i => !i.name.trim())}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-[#FF0000] hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition">
                  <Store size={14} /> Find Best Supplier &amp; Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showScan && (
        <ScanModal onClose={() => setShowScan(false)} onItems={raw => { addFromScan(raw); setShowScan(false); }} />
      )}

      {showCompare && items.length > 0 && (
        <SupplierCompareModal
          items={items.filter(i => i.name.trim()).map(it => ({ name: it.name, quantity: it.quantity }))}
          supplierType={supplierType}
          store={store}
          token={token}
          onClose={() => { setShowCompare(false); onClose(); }}
        />
      )}
    </div>
  );
}