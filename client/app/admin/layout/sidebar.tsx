"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import './Layout.css';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname(); // Tracks the current URL
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(true);

  const menuItems: Array<{
    name: string;
    icon: string;
    path?: string;
    badge?: string;
    subItems?: Array<{ name: string; icon: string; path: string }>;
  }> = [
    { name: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { 
      name: 'Portfolio',
      icon: '📁',
      subItems: [
        { name: 'Hero', icon: '👀', path: '/admin/hero' }, 
        { name: 'Hot Drops', icon: '🚀', path: '/admin/hot-drops' },
        { name: 'Studio', icon: '📄', path: '/admin/StudioAdminPage' },
        { name: 'RalleyzSection', icon: '📄', path: '/admin/RalleyzSection' },
        { name: 'Characters', icon: '🦸', path: '/admin/characters' },
        { name: 'Top Picks', icon: '⭐', path: '/admin/best-sellers' },
        { name: 'Shop By Age', icon: '🧸', path: '/admin/shop-by-age' },
        { name: 'Categories', icon: '🛒', path: '/admin/shop-by-category' },
        { name: 'Best of WOW', icon: '🍱', path: '/admin/bento-grid' },
        { name: 'Reviews', icon: '💬', path: '/admin/reviews' },
        { name: 'Services/Products', icon: '🛍️', path: '/admin/services' },
        { name: 'Contact Form', icon: '📬', path: '/admin/contact' },
        { name: 'Blog & Lifestyle', icon: '📝', path: '/admin/blog-lifestyle' },
        { name: 'Testimonials', icon: '🗣️', path: '/admin/testimonials' }
      ]
    },
    { name: 'Product', icon: '📈', path: '/admin/product' },
    { name: 'Order History', icon: '📦', path: '/admin/order-history' }, // <-- ADDED HERE
    { name: 'User Management', icon: '👥', path: '/admin/users'},
    { name: 'Dynamic Content', icon: '⚡', path: '/admin/dynamic-content' },
    { name: 'Settings', icon: '⚙️', path: '/admin/settings' },
  ];

  // Auto-sync the sidebar's active item based on the current URL
  useEffect(() => {
    if (!pathname) return;

    for (const item of menuItems) {
      if (item.path === pathname) {
        setActiveItem(item.name);
        break;
      }
      if (item.subItems) {
        const matchingSubItem = item.subItems.find(sub => sub.path === pathname);
        if (matchingSubItem) {
          setActiveItem(matchingSubItem.name);
          setIsPortfolioOpen(true); // Keep portfolio open if we are on a child route
          break;
        }
      }
    }
  }, [pathname]);

  const handleItemClick = (item: any) => {
    // 1. Handle Submenu Toggling (Folders)
    if (item.subItems) {
      setIsPortfolioOpen(!isPortfolioOpen);
      return; 
    }
    
    // 2. Handle Navigation
    if (item.path) {
      router.push(item.path);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="logo-section">
        <div className="logo-icon">P</div>
        <div className="logo-text">Pro<span>Flow</span></div>
      </div>

      {/* Nav */}
      <ul className="nav-links">
        {menuItems.map((item) => (
          <React.Fragment key={item.name}>
            <li 
              className={`nav-item ${activeItem === item.name && !item.subItems ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span style={{flex:1}}>{item.name}</span>
              
              {item.badge && (
                <span style={{
                  background: '#ef4444', color: 'white', fontSize: '0.7rem', 
                  padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'
                }}>
                  {item.badge}
                </span>
              )}

              {item.subItems && (
                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                  {isPortfolioOpen ? '▼' : '▶'}
                </span>
              )}
            </li>

            {/* Sub Menu */}
            {item.subItems && isPortfolioOpen && (
              <div className="sub-menu">
                {item.subItems.map((subItem) => (
                  <div 
                    key={subItem.name}
                    className={`sub-nav-item ${activeItem === subItem.name ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering parent click
                      handleItemClick(subItem);
                    }}
                  >
                    <span>{subItem.icon} {subItem.name}</span>
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </ul>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">JD</div>
          <div className="user-info">
            <h4>John Doe</h4>
            <p>john@company.com</p>
          </div>
        </div>
        <div 
          className="nav-item" 
          onClick={handleLogout}
          style={{ marginTop: '5px', color: '#ef4444', border: 'none', cursor: 'pointer' }}
        >
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
}