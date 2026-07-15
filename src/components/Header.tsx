/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, LogIn, Search, FileText } from 'lucide-react';

interface HeaderProps {
  currentView: 'verify' | 'admin-login' | 'admin-dashboard';
  onNavigate: (view: 'verify' | 'admin-login' | 'admin-dashboard') => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Header({
  currentView,
  onNavigate,
  isAdminLoggedIn,
  onLogout
}: HeaderProps) {
  const logoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWdacpfhGqope2aL72T9lkMz1LH4Mb6WDJUSN30VQy2jnxKHZ_AurUpVJv&s=10";

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      {/* Top green/red national flag ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="h-full bg-[#006a4e] flex-1"></div>
        <div className="h-full bg-[#f42a41] w-[20%]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4_">
        {/* Brand Logo as the Primary Headline */}
        <div 
          onClick={() => onNavigate('verify')}
          className="cursor-pointer group flex items-center justify-center sm:justify-start"
        >
          {/* Prominent National Seal Crest */}
          <img 
            src={logoUrl} 
            alt="Government of Bangladesh Crest" 
            className="h-14 sm:h-22 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Right Side: Quick Portal Actions */}
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
          
          {/* Admin Controls - Hidden unless logged in */}
          {isAdminLoggedIn && (
            <>
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  currentView === 'admin-dashboard' 
                    ? 'bg-[#006a4e] text-white shadow-sm' 
                    : 'bg-[#006a4e]/10 text-[#006a4e] hover:bg-[#006a4e]/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Console
              </button>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-150"
              >
                Log Out
              </button>
            </>
          )}
          
          {!isAdminLoggedIn && (
            <button
              onClick={() => onNavigate('verify')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-700 bg-gray-100/80 hover:bg-gray-100 transition-all"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
