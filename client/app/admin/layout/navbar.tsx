"use client";
import React from 'react';
import './Layout.css';

export default function Navbar() {
  return (
    <header className="navbar">
      <div style={{display: 'flex', alignItems: 'center'}}>
        <button className="mobile-toggle">☰</button>
        <div>
          <h2 className="nav-title">Dashboard</h2>
          <div className="nav-breadcrumbs">Home / <span style={{color: 'var(--primary)'}}>Overview</span></div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input type="text" className="search-input" placeholder="Search anything..." />
        </div>
        
        <div style={{fontSize: '1.2rem', cursor: 'pointer', opacity: 0.7}}>🔔</div>
      </div>
    </header>
  );
}