'use client';

import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Twitter, Instagram, Facebook, Youtube, Send, Mail, MapPin, Phone, Shield, CreditCard, Truck } from 'lucide-react';

const Footer = memo(({ theme }: { theme: 'dark' | 'light' }) => {
  const [email,        setEmail]       = useState('');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(theme);

  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) setCurrentTheme(e.detail as 'dark' | 'light'); };
    window.addEventListener('themechange', handler as EventListener);
    return () => window.removeEventListener('themechange', handler as EventListener);
  }, []);
  useEffect(() => { if (theme !== currentTheme) setCurrentTheme(theme); }, [theme]);

  const isLight = currentTheme === 'light';

  const FOOTER_LINKS = {
    Company:  ['About Us', 'Careers', 'Blog & News', 'Sustainability', 'Press'],
    Support:  ['Help Center', 'Track Order', 'Returns & Refunds', 'Privacy Policy', 'Terms of Service'],
    Shop:     ['Best Sellers', 'New Arrivals', 'Deals & Offers', 'Gift Cards', 'Bulk Orders'],
  };

  const PAYMENT_ICONS = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net Banking'];

  return (
    <footer className={`${isLight ? 'bg-gray-900 text-white' : 'bg-[#050505] text-white'}`}>

      {/* ── Newsletter strip ──────────────────────────────────────────── */}
      <div className="bg-[#0FA3B1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Stay in the Loop!</h3>
              <p className="text-teal-100 text-sm">Get exclusive deals, new arrivals & offers in your inbox.</p>
            </div>
            <div className="flex w-full md:w-auto gap-2 max-w-md">
              <div className="flex-1 flex items-center bg-white/15 border border-white/20 rounded-xl overflow-hidden">
                <Mail size={16} className="ml-4 text-teal-100 shrink-0" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-teal-200 outline-none"
                />
              </div>
              <button className="px-5 py-3 bg-[#FF0000] hover:bg-[#e00000] text-white font-bold rounded-xl text-sm transition shrink-0 flex items-center gap-2">
                <Send size={15} /> Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main footer ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#FF0000]/60 shrink-0">
                <img src="/remise-logo.svg" alt="Remise" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black">R<span className="text-[#FF0000]">E</span>mise</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              India's favourite lifestyle destination. Groceries, cosmetics, toys & more — delivered to your door.
            </p>

            {/* Contact */}
            <div className="space-y-2">
              <a href="tel:+919677710045" className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#D4AF37] transition">
                <Phone size={13} className="text-[#D4AF37] shrink-0" /> +91 96777 10045
              </a>
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <MapPin size={13} className="text-[#D4AF37] shrink-0 mt-0.5" /> Chennai, Tamil Nadu, India
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-2.5">
              {[Twitter, Instagram, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#"
                  className="p-2 rounded-lg bg-white/5 hover:bg-[#FF0000] hover:text-white transition text-gray-400">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-sm mb-4 text-white">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-xs text-gray-400 hover:text-[#D4AF37] transition">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Nearby Offers', href: '/nearby' },
                { label: 'Our Services',  href: '/services' },
                { label: 'About Us',      href: '/about' },
                { label: 'Testimonials',  href: '/testimonials' },
                { label: 'My Orders',     href: '/orders' },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-xs text-gray-400 hover:text-[#D4AF37] transition">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Trust / Payment bar ──────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Trust icons */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Shield size={13} className="text-green-500" /> Secure Checkout
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Truck size={13} className="text-[#D4AF37]" /> Fast Delivery
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CreditCard size={13} className="text-blue-400" /> Easy Payments
              </div>
            </div>

            {/* Payment methods */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 mr-1">We accept:</span>
              {PAYMENT_ICONS.map(p => (
                <span key={p} className="px-2 py-0.5 bg-white/10 rounded text-[9px] text-gray-300 font-medium border border-white/10">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
            <p>© 2025 Remise. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#D4AF37] transition">Privacy Policy</a>
              <a href="#" className="hover:text-[#D4AF37] transition">Terms of Use</a>
              <a href="#" className="hover:text-[#D4AF37] transition">Cookie Policy</a>
              <a href="#" className="hover:text-[#D4AF37] transition">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = 'Footer';

interface FooterProps { theme: 'dark' | 'light'; }
export default function FooterComponent({ theme }: FooterProps) {
  return <Footer theme={theme} />;
}
