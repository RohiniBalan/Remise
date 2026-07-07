import React from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import './Layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {/* The Scrollable Area */}
        <main className="page-scroll-container">
          {children}
        </main>
      </div>
    </div>
  );
}