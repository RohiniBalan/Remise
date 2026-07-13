'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ScanLine, Plus, Trash2, Printer, Copy, Check,
  Upload, RefreshCw, AlertCircle, CheckCircle2,
  X, Sparkles, ShoppingBasket, ListChecks, Languages, Store, Mic, MicOff, HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CompareModal from './CompareModal';
import { useSpeechRecognition, VOICE_LANGUAGES, VoiceLanguageOption } from '../../hooks/useSpeechRecognition';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BulkItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  // Set when a voice-parsed item's name/quantity was ambiguous — flagged
  // for the customer to confirm/edit inline instead of silently dropping it
  // or failing the whole request.
  needsClarification?: boolean;
}

type ScanStep = 'idle' | 'scanning' | 'done' | 'error';

// ── Scan Modal ────────────────────────────────────────────────────────────────

function ScanModal({
  onClose,
  onItems,
}: {
  onClose: () => void;
  onItems: (items: { name: string; quantity: string }[]) => void;
}) {
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState('');
  const [step,     setStep]     = useState<ScanStep>('idle');
  const [errMsg,   setErrMsg]   = useState('');
  const [dragging, setDragging] = useState(false);
  const [count,    setCount]    = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('idle');
    setErrMsg('');
  };

  const handleScan = async () => {
    if (!file) return;
    setStep('scanning'); setErrMsg('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res  = await fetch('/api/smart-bulk-scan', { method: 'POST', body: fd });
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#BBD5DA] w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[#BBD5DA] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-teal-600" />
            <h2 className="text-base font-bold text-gray-900">Scan Purchase List</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          {step !== 'done' && (
            <div
              className={`border-2 border-dashed rounded-2xl transition cursor-pointer
                ${dragging ? 'border-teal-500 bg-teal-50' : 'border-[#BBD5DA] hover:border-teal-400 hover:bg-[#F5F5F5]'}
                ${preview ? 'p-2' : 'p-8'}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault(); setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f && f.type.startsWith('image/')) pickFile(f);
              }}
              onClick={() => !preview && inputRef.current?.click()}
            >
              <input
                ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
              />
              {preview
                ? (
                  <div className="relative">
                    <img src={preview} alt="List" className="w-full max-h-52 object-contain rounded-xl" />
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); setPreview(''); setStep('idle'); }}
                      className="absolute top-2 right-2 bg-white/90 border border-gray-200 rounded-full p-1 shadow"
                    >
                      <X size={13} className="text-gray-600" />
                    </button>
                  </div>
                )
                : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#DFF1F1] flex items-center justify-center">
                      <Upload size={22} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Drop your purchase list here</p>
                      <p className="text-xs text-gray-400 mt-0.5">Handwritten or printed · Any Indian language</p>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* States */}
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
              <button
                onClick={onClose}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-sm font-semibold text-white transition"
              >
                View List →
              </button>
            </div>
          )}

          {/* Scan button */}
          {step !== 'done' && (
            <button
              onClick={handleScan}
              disabled={!file || step === 'scanning'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
            >
              {step === 'scanning'
                ? <><RefreshCw size={14} className="animate-spin" /> Scanning…</>
                : <><Sparkles size={14} /> Scan & Extract Items</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

let idCounter = 0;
const uid = () => `item-${++idCounter}-${Date.now()}`;

export default function BulkPurchasePage() {
  const [items,         setItems]         = useState<BulkItem[]>([]);
  const [showScan,      setShowScan]      = useState(false);
  const [showCompare,   setShowCompare]   = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [voiceLang,    setVoiceLang]    = useState<VoiceLanguageOption>(VOICE_LANGUAGES[0]);
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [voiceError,   setVoiceError]   = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const addFromScan = (raw: { name: string; quantity: string }[]) => {
    const newItems: BulkItem[] = raw.map(r => ({
      id:       uid(),
      name:     r.name,
      quantity: r.quantity,
      checked:  false,
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  // Speak-your-list: transcript → /api/voice-purchase-list (translates via
  // the same indicTranslate() pipeline every OCR route uses, then Claude
  // splits it into items) → appended into the SAME `items` list the "Scan
  // Paper List" button already feeds, so CompareModal/matchCart/placeOrder
  // downstream are untouched. Ambiguous items are still added, just flagged.
  const addFromVoice = (raw: { name: string; quantity: string; needsClarification?: boolean }[]) => {
    const newItems: BulkItem[] = raw.map(r => ({
      id: uid(), name: r.name, quantity: r.quantity, checked: false, needsClarification: r.needsClarification,
    }));
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

  // Translate typed Tanglish/Tamil name to English on commit (blur / Enter)
  const commitName = useCallback(async (id: string, value: string) => {
    setEditingId(null);
    const trimmed = value.trim();
    if (!trimmed) return;

    setTranslatingId(id);
    try {
      const res  = await fetch('/api/tanglish-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (data.translated && data.translated !== trimmed) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, name: data.translated } : i));
      }
    } catch { /* keep original on error */ }
    finally { setTranslatingId(null); }
  }, []);

  const toggleCheck = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));

  const remove = (id: string) =>
    setItems(prev => prev.filter(i => i.id !== id));

  const clearAll = () => setItems([]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = items.map((it, idx) =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">${idx + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">${it.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#0d9488">${it.quantity || '—'}</td>
      </tr>`
    ).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Purchase List</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}h2{margin-bottom:16px}
      table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 12px;background:#f0fdfa;border-bottom:2px solid #0d9488}
      @media print{button{display:none}}</style></head>
      <body><h2>Monthly / Bulk Purchase List</h2>
      <p style="color:#888;font-size:13px">Date: ${new Date().toLocaleDateString('en-IN')}</p>
      <table><thead><tr><th>#</th><th>Item</th><th>Quantity</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  const handleCopy = async () => {
    const text = items
      .map((it, i) => `${i + 1}. ${it.name}${it.quantity ? ` — ${it.quantity}` : ''}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-[80px] sm:pt-[112px] lg:pt-[152px] pb-20">

      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#BBD5DA]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#DFF1F1] flex items-center justify-center shrink-0">
            <ShoppingBasket size={28} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Monthly / Bulk Purchase</h1>
            <p className="text-gray-500 text-sm mt-1">
              Scan a handwritten or printed list — items and quantities are extracted automatically in any Indian language.
            </p>
          </div>
          <button
            onClick={() => setShowScan(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm shrink-0"
          >
            <ScanLine size={16} /> Scan Paper List
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 space-y-4">

        {/* ── Voice entry ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#BBD5DA] rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {VOICE_LANGUAGES.map(l => (
                <button key={l.code} type="button" onClick={() => setVoiceLang(l)} disabled={voice.listening || voiceParsing}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition disabled:opacity-50 ${
                    voiceLang.code === l.code ? 'bg-teal-600 text-white' : 'bg-[#F5F5F5] text-gray-600 border border-[#BBD5DA]'
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
            <button type="button"
              onClick={() => (voice.listening ? voice.stop() : voice.start(voiceLang))}
              disabled={voiceParsing || !voice.supported}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 shrink-0 ${
                voice.listening ? 'bg-[#FF0000] text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}>
              {voiceParsing
                ? <><RefreshCw size={14} className="animate-spin" /> Understanding…</>
                : voice.listening
                ? <><MicOff size={14} /> Stop</>
                : <><Mic size={14} /> Speak your list</>}
            </button>
          </div>
          {!voice.supported && <p className="text-xs text-gray-400">Voice input isn't supported in this browser — try Chrome or Edge.</p>}
          {voice.listening && <p className="text-xs text-teal-700">Listening… "{voice.interimTranscript || voice.transcript || '…'}"</p>}
          {(voice.error || voiceError) && <p className="text-xs text-[#FF0000] flex items-center gap-1"><AlertCircle size={11} />{voice.error || voiceError}</p>}
        </div>

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {items.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-12 text-center shadow-sm">
            <ListChecks size={48} className="text-[#BBD5DA] mx-auto mb-4" />
            <p className="font-semibold text-gray-700 mb-1">No items yet</p>
            <p className="text-sm text-gray-400 mb-6">Scan a paper list or add items manually</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowScan(true)}
                className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
              >
                <ScanLine size={15} /> Scan Paper List
              </button>
              <button
                onClick={addBlank}
                className="flex items-center justify-center gap-2 bg-[#F5F5F5] hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-xl transition"
              >
                <Plus size={15} /> Add Manually
              </button>
            </div>
          </div>
        )}

        {/* ── List ─────────────────────────────────────────────────────────── */}
        {items.length > 0 && (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{items.length}</span> item{items.length !== 1 ? 's' : ''}
                {checkedCount > 0 && <span className="ml-2 text-teal-600">· {checkedCount} checked</span>}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompare(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-[#FF0000] hover:bg-red-700 text-white px-3 py-2 rounded-xl transition"
                >
                  <Store size={12} /> Find Cheapest Store &amp; Order
                </button>
                <button
                  onClick={() => setShowScan(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-xl transition"
                >
                  <ScanLine size={12} /> Scan More
                </button>
                <button
                  onClick={addBlank}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 px-3 py-2 rounded-xl transition"
                >
                  <Plus size={12} /> Add Item
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 px-3 py-2 rounded-xl transition"
                >
                  {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 px-3 py-2 rounded-xl transition"
                >
                  <Printer size={12} /> Print
                </button>
              </div>
            </div>

            {/* Items table */}
            <div className="bg-white rounded-2xl border border-[#BBD5DA] shadow-sm overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[2rem_1fr_7rem_2.5rem] gap-2 px-4 py-2.5 bg-[#F5F5F5] border-b border-[#BBD5DA]">
                <span />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</span>
                <span />
              </div>

              <AnimatePresence initial={false}>
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`grid grid-cols-[2rem_1fr_7rem_2.5rem] gap-2 items-center px-4 py-3
                      ${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}
                      ${item.checked ? 'opacity-50' : ''}
                      ${item.needsClarification ? 'bg-amber-50' : ''}
                      border-b border-[#BBD5DA] last:border-0`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleCheck(item.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition
                        ${item.checked ? 'bg-teal-600 border-teal-600' : 'border-gray-300 hover:border-teal-400'}`}
                    >
                      {item.checked && <Check size={11} className="text-white" strokeWidth={3} />}
                    </button>

                    {/* Name */}
                    {editingId === item.id
                      ? (
                        <div className="relative">
                          <input
                            autoFocus
                            value={item.name}
                            onChange={e => update(item.id, 'name', e.target.value)}
                            onBlur={e => commitName(item.id, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault();
                                commitName(item.id, item.name);
                              }
                            }}
                            placeholder="Type in English or Tanglish…"
                            className="w-full bg-[#DFF1F1] border border-teal-300 rounded-lg px-2 py-1 text-sm outline-none pr-6"
                          />
                          <Languages size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 pointer-events-none" />
                        </div>
                      )
                      : translatingId === item.id
                      ? (
                        <div className="flex items-center gap-1.5 text-sm text-teal-600">
                          <RefreshCw size={12} className="animate-spin shrink-0" />
                          <span className="truncate italic text-xs">Translating…</span>
                        </div>
                      )
                      : (
                        <button
                          onClick={() => setEditingId(item.id)}
                          className={`flex items-center gap-1.5 text-left text-sm font-medium text-gray-800 truncate hover:text-teal-700 transition
                            ${item.checked ? 'line-through text-gray-400' : ''}`}
                        >
                          {item.needsClarification && <HelpCircle size={12} className="text-amber-500 shrink-0" />}
                          <span className="truncate">{item.name || <span className="text-gray-300 italic">tap to name</span>}</span>
                          {item.needsClarification && <span className="text-[10px] text-amber-600 font-semibold shrink-0">confirm?</span>}
                        </button>
                      )}

                    {/* Quantity */}
                    <input
                      value={item.quantity}
                      onChange={e => update(item.id, 'quantity', e.target.value)}
                      placeholder="e.g. 2 kg"
                      className="w-full bg-transparent border border-transparent hover:border-[#BBD5DA] focus:border-teal-400 focus:bg-[#DFF1F1] rounded-lg px-2 py-1 text-sm text-teal-700 font-medium outline-none transition placeholder-gray-300"
                    />

                    {/* Delete */}
                    <button
                      onClick={() => remove(item.id)}
                      className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1"
              >
                <Trash2 size={11} /> Clear all
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-white hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 px-4 py-2.5 rounded-xl transition"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy List'}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl transition shadow-sm"
                >
                  <Printer size={14} /> Print List
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showScan && (
        <ScanModal
          onClose={() => setShowScan(false)}
          onItems={raw => { addFromScan(raw); setShowScan(false); }}
        />
      )}

      {showCompare && items.length > 0 && (
        <CompareModal
          items={items.map(it => ({ name: it.name, quantity: it.quantity }))}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}
