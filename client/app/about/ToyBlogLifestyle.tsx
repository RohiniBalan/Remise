'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components-main/NavbarHome';
import FooterComponent from '../components-sections/Footer';

import { 
  ArrowUpRight, Sparkles, ChevronRight, ShieldCheck, Truck, RotateCcw, 
  Award, Star, Gift, Smile, Globe2, Shield, Rocket, Headphones, Globe, Loader2
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Globe2, Smile, Shield, Rocket
};

export default function ToyBlogLifestyle({ isPreview = false, previewData = null }: { isPreview?: boolean, previewData?: any }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isPreview);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }

    const handleThemeChange = (e: CustomEvent) => {
      let newTheme = 'dark';
      if (typeof e.detail === 'string' && (e.detail === 'dark' || e.detail === 'light')) {
        newTheme = e.detail;
      } else if (e.detail?.theme) {
        newTheme = e.detail.theme;
      }
      
      setTheme(newTheme as 'dark' | 'light');
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };

    window.addEventListener('theme-change', handleThemeChange as EventListener);
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isPreview && previewData) {
      setData(previewData);
      return;
    }

    const fetchData = async () => {
      try {
        const API_URL = "https://wow-lifebackend.onrender.com/api";
        const response = await fetch(`${API_URL}/blog-lifestyle`);
        const result = await response.json();
        if (result.success && result.data) setData(result.data);
      } catch (error) {
        console.error('Error fetching blog data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isPreview, previewData]);

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.05]);
  const svgPattern = "url(\"data:image/svg+xml,%3Csvg%20width='60'%20height='60'%20viewBox='0%200%2060%2060'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='none'%20fill-rule='evenodd'%3E%3Cg%20fill='%23D4AF37'%20fill-opacity='0.05'%3E%3Cpath%20d='M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

  if (isLoading || !data) {
    return (
      <div className={`min-h-screen flex justify-center items-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FAF8F5]'}`}>
        <Loader2 className="animate-spin text-[#D4AF37] w-12 h-12" />
      </div>
    );
  }

  const { featuredArticle, articles, timeline, testimonials } = data;

  return (
    <div className={`relative min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0A0A0A] text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      {!isPreview && <Navbar theme={theme} toggleTheme={toggleTheme} />}

      <div ref={containerRef} className={`${isPreview ? 'py-12' : 'pt-[70px]'} selection:bg-[#D4AF37]/30`}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* 2. Hero Section */}
        <section className="relative w-full pt-20 pb-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="grid lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-7">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 mb-10">
                  <span className={`px-5 py-2 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full inline-flex items-center gap-2 ${theme === 'dark' ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500' : 'bg-gradient-to-r from-black to-gray-800'}`}>
                    <Sparkles size={12} />
                    {featuredArticle.category}
                  </span>
                  <div className={`h-px w-16 bg-gradient-to-r to-transparent ${theme === 'dark' ? 'from-gray-700' : 'from-gray-300'}`} />
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">A Dream Realized</span>
                </motion.div>
                
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tighter mb-10">
                  <span className={`bg-clip-text text-transparent bg-gradient-to-b ${theme === 'dark' ? 'from-white via-gray-200 to-gray-400' : 'from-gray-900 via-gray-800 to-black'}`}>
                    {featuredArticle.title?.split(':')[0]}
                  </span>
                  <br />
                  <span className="text-[#D4AF37] italic">{featuredArticle.title?.split(':')[1] || ''}</span>
                </motion.h2>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className={`text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl font-light italic pl-6 border-l-4 border-[#D4AF37]/30 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {featuredArticle.excerpt}
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {featuredArticle.stats && Object.entries(featuredArticle.stats).map(([key, value]) => (
                    <div key={key} className={`text-center p-4 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-black/30 border-white/5' : 'bg-white/50 border-gray-100'}`}>
                      <div className="text-3xl font-black text-[#D4AF37] mb-2">{String(value)}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </div>
                    </div>
                  ))}
                </motion.div>

                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="group flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-colors">
                  <span className="relative">
                    Explore Heritage Timeline
                    <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-[#D4AF37] transition-all duration-300" />
                  </span>
                  <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#D4AF37] group-hover:to-amber-500 group-hover:border-transparent transition-all duration-500 group-hover:rotate-90 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                    <ChevronRight size={20} className="group-hover:text-white" />
                  </div>
                </motion.button>
              </div>

              <div className="lg:col-span-5">
                <motion.div style={{ scale: heroScale }} className="relative aspect-[3/4] overflow-hidden rounded-[3rem] shadow-2xl group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-transparent z-10" />
                  <img 
                    src={featuredArticle.image} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                    alt="Featured"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
                    <div className="text-white">
                      <div className="text-6xl font-black italic mb-2">1760</div>
                      <div className="text-sm font-light opacity-90">The year magic began</div>
                    </div>
                  </div>
                  <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                    <Sparkles size={20} className="text-white" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Heritage Timeline */}
        <section className={`py-24 transition-colors ${theme === 'dark' ? 'bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]' : 'bg-gradient-to-b from-white to-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest">Timeline</span>
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
              </motion.div>
              <h3 className="text-5xl font-black mb-6">
                <span className={`bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white via-gray-300 to-white' : 'from-gray-900 via-gray-700 to-gray-900'}`}>
                  265 Years of 
                </span>
                <span className="text-[#D4AF37] block italic">Joy & Innovation</span>
              </h3>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-[#D4AF37] via-amber-400 to-transparent" />
              <div className="space-y-24">
                {timeline.map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-12' : 'text-left pl-12'}`}>
                      <div className={`inline-block p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all ${
                        theme === 'dark' ? 'bg-[#111] border-white/5' : 'bg-white border-gray-100'
                      } ${item.highlight ? 'border-l-4 border-l-[#D4AF37]' : ''}`}>
                        <div className="text-3xl font-black text-[#D4AF37] mb-2">{item.year}</div>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{item.event}</p>
                      </div>
                    </div>
                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-400 border-4 shadow-lg transition-colors ${theme === 'dark' ? 'border-[#0F0F0F]' : 'border-white'}`} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. The Promise Section */}
        <section className="py-24 relative overflow-hidden">
          <div className={`absolute inset-0 transition-opacity ${theme === 'dark' ? 'opacity-100' : 'opacity-20'}`} style={{ backgroundImage: svgPattern }} />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} className="w-20 h-20 bg-gradient-to-r from-[#D4AF37] to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Award size={32} className="text-white" />
              </motion.div>
              <h3 className="text-5xl font-black uppercase mb-4">
                Our <span className="text-[#D4AF37] italic">Gold Standard</span> Promise
              </h3>
              <p className="text-gray-500 uppercase tracking-widest text-sm font-bold max-w-2xl mx-auto">
                Where centuries of heritage meet modern excellence in every detail
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <RotateCcw />, title: "Hassle-Free Returns", desc: "30-day return policy on all unopened items. Your satisfaction is our priority.", color: "from-emerald-500 to-teal-400" },
                { icon: <ShieldCheck />, title: "Certified Safety", desc: "All toys meet or exceed international safety standards. Regular third-party testing.", color: "from-blue-500 to-cyan-400" },
                { icon: <Truck />, title: "Free Express Delivery", desc: "Free shipping above ₹999. Same-day delivery available in metro cities.", color: "from-purple-500 to-pink-400" },
                { icon: <Headphones />, title: "Dedicated Support", desc: "24/7 customer care with toy experts. We're here to help you choose the perfect gift.", color: "from-orange-500 to-red-400" }
              ].map((promise, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.4 }} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-3xl" style={{ background: `linear-gradient(135deg, ${promise.color.split(' ')[1]}, ${promise.color.split(' ')[3]})` }} />
                  <div className={`relative p-8 rounded-2xl border shadow-sm group-hover:shadow-xl transition-all duration-300 h-full ${theme === 'dark' ? 'bg-[#111] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${promise.color} flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform`}>
                      {promise.icon}
                    </div>
                    <h4 className="text-xl font-black mb-4 group-hover:text-[#D4AF37] transition-colors">{promise.title}</h4>
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{promise.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. The Global Feed */}
        <section className={`py-24 transition-colors ${theme === 'dark' ? 'bg-gradient-to-b from-[#0A0A0A] to-[#111]' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20">
              <div>
                <div className="inline-flex items-center gap-3 mb-6">
                  <Globe className="text-[#D4AF37]" size={24} />
                  <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest">Global Chronicles</span>
                </div>
                <h3 className="text-5xl font-black uppercase italic tracking-tighter mb-4">
                  Worldwide <span className="text-[#D4AF37]">Toy Revolution</span>
                </h3>
                <p className="text-gray-500 text-sm max-w-2xl">
                  From London's Regent Street to Mumbai's flagship store - discover how we're redefining play across continents
                </p>
              </div>
              <button className={`mt-6 md:mt-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 px-6 py-3 rounded-full hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all group ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                View All Stories
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {articles.map((article: any) => {
                const IconComp = ICON_MAP[article.icon] || Globe2;
                return (
                  <motion.article key={article.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -8 }} className={`group relative overflow-hidden rounded-3xl border shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col ${theme === 'dark' ? 'bg-[#111] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="relative h-48 overflow-hidden flex-shrink-0">
                      <img src={article.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={article.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white">
                          <IconComp size={20} />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{article.category}</span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="text-xs text-gray-400 mb-3 font-medium">{article.date}</div>
                      <h4 className="text-xl font-black mb-4 group-hover:text-[#D4AF37] transition-colors line-clamp-2">{article.title}</h4>
                      <p className={`text-sm mb-6 line-clamp-3 flex-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{article.excerpt}</p>
                      <button className="mt-auto text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-[#D4AF37] group/link">
                        Read Feature
                        <ArrowUpRight size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Testimonials */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-amber-500/5 transition-colors" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-4 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />)}
              </div>
              <h3 className="text-5xl font-black mb-6">
                <span className={`bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'}`}>Voices of </span>
                <span className="text-[#D4AF37] block italic">Joy & Trust</span>
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial: any, i: number) => (
                <motion.div key={testimonial.id || i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`p-8 rounded-3xl border shadow-lg flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#111] border-white/5' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-400 flex items-center justify-center text-white font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role} • {testimonial.location}</p>
                    </div>
                  </div>
                  <p className={`mb-6 italic flex-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>"{testimonial.content}"</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                      ))}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                      Verified Purchase
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} className="w-24 h-24 bg-gradient-to-r from-[#D4AF37] to-amber-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Gift size={32} className="text-white" />
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black mb-8">
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white via-gray-200 to-white' : 'from-gray-900 via-gray-800 to-gray-900'}`}>Experience the Magic </span>
              <span className="text-[#D4AF37] block italic">of Centuries</span>
            </h2>
            <p className={`text-xl mb-12 max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Visit our stores to witness history come alive through interactive exhibits, 
              limited edition collections, and the world's finest toy curation.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-white font-black uppercase tracking-widest rounded-full text-sm hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-300">
                Find Your Nearest Store
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`px-10 py-4 border-2 font-black uppercase tracking-widest rounded-full text-sm hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all ${theme === 'dark' ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                Explore Collections
              </motion.button>
            </div>
          </div>
        </section>
      </div>

      {!isPreview && <FooterComponent theme={theme} />}
    </div>
  );
}