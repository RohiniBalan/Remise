'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';

// Define your backend API URL here
const API_URL = "https://wow-lifebackend.onrender.com/api";

export interface CartItem {
  img?: string;
  id: string; 
  title: string;
  price: number;
  image: string;
  quantity: number;
  brand?: string; 
  category?: string;
  totalStock: number; 
}

export interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem | null) => void;
  
  isCartOpen: boolean;
  cartView: 'cart' | 'checkout';
  openCart: (view?: 'cart' | 'checkout') => void;
  closeCart: () => void;
  setCartView: (view: 'cart' | 'checkout') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartView, setCartView] = useState<'cart' | 'checkout'>('cart');

  // --- CUSTOM TOAST STATE ---
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'error' | 'success' }>({ 
    show: false, message: '', type: 'error' 
  });

  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchCartFromBackend = async (token: string) => {
    try {
      // Updated fetch URL
      const response = await fetch(`${API_URL}/user/cart`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.cart) {
        setCart(data.cart);
        localStorage.setItem('cart', JSON.stringify(data.cart));
      }
    } catch (error) {
      console.error('Failed to fetch cart from backend:', error);
    }
  };

  const syncCartToBackend = async (currentCart: CartItem[]) => {
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;
    if (!token) return;

    try {
      // Updated fetch URL
      await fetch(`${API_URL}/user/cart/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cartItems: currentCart.map((item) => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });
    } catch (error) {
      console.error('Failed to sync cart to database:', error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;

    if (token) fetchCartFromBackend(token);
    else {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }

    // Theme listener for the toast UI
    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail) setTheme(event.detail as 'dark' | 'light');
    };
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (currentTheme) setTheme(currentTheme);

    return () => window.removeEventListener('theme-change', handleThemeChange as EventListener);
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart, isMounted]);

  const addToCart = (product: any) => {
    const stock = product.totalStock || 0;
    const productId = product.id || product._id;
    
    // Check initial stock
    if (stock <= 0) {
      showNotification('Out of stock', 'error');
      return;
    }

    // Check existing item quantity before updating state
    const existingItem = cart.find((item) => item.id === productId);
    if (existingItem && existingItem.quantity >= stock) {
      showNotification('Out of stock', 'error');
      return;
    }

    setCart((prevCart) => {
      const itemInPrev = prevCart.find((item) => item.id === productId);
      
      // Fallback check inside the setter just in case
      if (itemInPrev && itemInPrev.quantity >= stock) {
        return prevCart;
      }
      
      let newCart;
      if (itemInPrev) {
        newCart = prevCart.map((item) => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        newCart = [...prevCart, { 
          id: productId, 
          title: product.title, 
          price: product.price, 
          image: product.images && product.images.length > 0 ? product.images[0] : (product.imageUrl || product.img), 
          quantity: 1,
          totalStock: stock 
        }];
      }

      syncCartToBackend(newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== productId);
      syncCartToBackend(newCart);
      return newCart;
    });
  };

  const decreaseQuantity = (productId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      let newCart;

      if (existingItem?.quantity === 1) {
        newCart = prevCart.filter((item) => item.id !== productId);
      } else {
        newCart = prevCart.map((item) => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }

      syncCartToBackend(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    syncCartToBackend([]);
  };

  const openCart = (view: 'cart' | 'checkout' = 'cart') => {
    setCartView(view);
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
    setTimeout(() => setCartView('cart'), 300);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, cartCount, addToCart, removeFromCart, decreaseQuantity, clearCart,
      buyNowItem, setBuyNowItem, isCartOpen, cartView, openCart, closeCart, setCartView
    }}>
      {/* GLOBAL TOAST NOTIFICATION RENDERED HERE */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }} 
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            style={{ position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md font-semibold tracking-wide border ${
              theme === 'light' 
                ? 'bg-white/90 border-gray-200 text-gray-900 shadow-black/10' 
                : 'bg-black/80 border-[#333] text-white shadow-[#D4AF37]/10'
            }`}
          >
            {toast.type === 'error' ? (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/10 text-red-500">
                <AlertCircle size={16} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500/10 text-green-500">
                <CheckCircle size={16} strokeWidth={2.5} />
              </div>
            )}
            <span className="text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {children}
    </CartContext.Provider>
  );
};

// EXPORT THE HOOK
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
}