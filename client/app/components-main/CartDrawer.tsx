'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '@/app/components-main/CartContext';

interface CartDrawerProps { theme: 'dark' | 'light'; isOpen?: boolean; onClose?: () => void; }

export default function CartDrawer({ theme }: CartDrawerProps) {
  const router = useRouter();
  const { cart, removeFromCart, addToCart, decreaseQuantity, cartCount, isCartOpen, closeCart, setBuyNowItem } = useCart();

  const subtotal   = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const isLight    = theme === 'light';

  const handleCheckout = () => { setBuyNowItem(null); closeCart(); router.push('/checkout'); };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full z-[210] flex flex-col w-full sm:w-[420px] shadow-2xl ${isLight ? 'bg-white' : 'bg-gray-950 border-l border-white/10'}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${isLight ? 'border-[#BBD5DA]' : 'border-white/10'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#DFF1F1] flex items-center justify-center">
                  <ShoppingBag size={16} className="text-teal-600" />
                </div>
                <div>
                  <h2 className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Shopping Cart</h2>
                  <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={closeCart}
                className={`p-2 rounded-xl transition ${isLight ? 'text-gray-400 hover:bg-[#F5F5F5]' : 'text-gray-400 hover:bg-white/10'}`}>
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isLight ? 'bg-[#DFF1F1]' : 'bg-white/5'}`}>
                    <ShoppingBag size={36} className="text-[#BBD5DA]" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${isLight ? 'text-gray-800' : 'text-white'}`}>Your cart is empty</h3>
                    <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Add items from the store to get started.</p>
                  </div>
                  <button onClick={closeCart}
                    className="px-6 py-2.5 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold text-sm rounded-xl transition">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.id}
                      className={`flex gap-3 p-3 rounded-xl border transition ${isLight ? 'bg-[#F5F5F5] border-[#BBD5DA] hover:border-[#0FA3B1]' : 'bg-gray-900 border-white/10 hover:border-white/20'}`}>

                      {/* Image */}
                      <div className={`w-20 h-20 rounded-lg shrink-0 overflow-hidden flex items-center justify-center p-1.5 ${isLight ? 'bg-white border border-[#BBD5DA]' : 'bg-gray-800'}`}>
                        <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight line-clamp-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                            {item.title}
                          </p>
                          <button onClick={() => removeFromCart(item.id)}
                            className={`p-1.5 rounded-lg transition shrink-0 ${isLight ? 'text-gray-400 hover:bg-red-50 hover:text-[#FF0000]' : 'text-gray-500 hover:text-[#FF0000]'}`}>
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                          {/* Qty controls */}
                          <div className={`flex items-center rounded-lg border overflow-hidden ${isLight ? 'border-[#BBD5DA] bg-white' : 'border-white/10 bg-gray-800'}`}>
                            <button onClick={() => decreaseQuantity(item.id)}
                              className={`w-7 h-7 flex items-center justify-center transition ${isLight ? 'hover:bg-[#F5F5F5] text-gray-600' : 'hover:bg-white/10 text-gray-400'}`}>
                              <Minus size={11} />
                            </button>
                            <span className={`w-7 text-center text-xs font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              disabled={item.quantity >= (item.totalStock || Infinity)}
                              className={`w-7 h-7 flex items-center justify-center transition disabled:opacity-30 ${isLight ? 'hover:bg-[#F5F5F5] text-gray-600' : 'hover:bg-white/10 text-gray-400'}`}>
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className={`p-5 border-t shrink-0 ${isLight ? 'border-[#BBD5DA] bg-white' : 'border-white/10 bg-gray-950'}`}>
                {/* Free delivery nudge */}
                {subtotal < 499 && (
                  <div className={`flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl text-xs ${isLight ? 'bg-[#DFF1F1] border border-[#BBD5DA] text-teal-700' : 'bg-teal-900/30 border border-teal-700/30 text-teal-400'}`}>
                    <Tag size={12} className="shrink-0" />
                    Add ₹{(499 - subtotal).toFixed(0)} more for <strong className="ml-1">FREE delivery!</strong>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 mb-4">
                  <div className={`flex justify-between text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>Subtotal ({cartCount} items)</span>
                    <span className={isLight ? 'text-gray-800 font-medium' : 'text-white font-medium'}>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">{subtotal >= 499 ? 'FREE' : '₹49'}</span>
                  </div>
                  <div className={`flex justify-between items-center pt-3 border-t ${isLight ? 'border-[#BBD5DA]' : 'border-white/10'}`}>
                    <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Total</span>
                    <span className={`text-xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      ₹{(subtotal + (subtotal >= 499 ? 0 : 49)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button onClick={handleCheckout}
                  className="w-full py-3.5 bg-[#FF0000] hover:bg-[#e00000] text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm group text-sm">
                  Proceed to Checkout
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
