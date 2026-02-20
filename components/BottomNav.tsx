"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Home, ScanLine, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on landing, onboarding, or auth pages
  if (pathname === '/' || pathname === '/onboarding' || pathname.startsWith('/auth')) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#141416]/95 backdrop-blur-xl border-t border-[#2A2A2E] z-50">
      <div className="max-w-md mx-auto px-6 py-3">
        <div className="flex items-center justify-around">
          {/* Home */}
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center gap-1 py-2 px-4 transition-colors group"
          >
            <div className="relative">
              <Home
                size={24}
                className={`transition-colors ${
                  isActive('/home')
                    ? 'text-[#FF6B35]'
                    : 'text-[#636369] group-hover:text-[#A0A0A8]'
                }`}
              />
              {isActive('/home') && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF6B35]"></div>
              )}
            </div>
            <span
              className={`text-[11px] font-semibold transition-colors ${
                isActive('/home')
                  ? 'text-[#FF6B35]'
                  : 'text-[#636369] group-hover:text-[#A0A0A8]'
              }`}
            >
              Home
            </span>
          </button>

          {/* Join */}
          <button
            onClick={() => router.push('/join')}
            className="flex flex-col items-center gap-1 py-2 px-4 transition-colors group"
          >
            <div className="relative">
              <ScanLine
                size={24}
                className={`transition-colors ${
                  isActive('/join')
                    ? 'text-[#FF6B35]'
                    : 'text-[#636369] group-hover:text-[#A0A0A8]'
                }`}
              />
              {isActive('/join') && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF6B35]"></div>
              )}
            </div>
            <span
              className={`text-[11px] font-semibold transition-colors ${
                isActive('/join')
                  ? 'text-[#FF6B35]'
                  : 'text-[#636369] group-hover:text-[#A0A0A8]'
              }`}
            >
              Join
            </span>
          </button>

          {/* Profile */}
          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 py-2 px-4 transition-colors group"
          >
            <div className="relative">
              <User
                size={24}
                className={`transition-colors ${
                  isActive('/profile')
                    ? 'text-[#FF6B35]'
                    : 'text-[#636369] group-hover:text-[#A0A0A8]'
                }`}
              />
              {isActive('/profile') && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF6B35]"></div>
              )}
            </div>
            <span
              className={`text-[11px] font-semibold transition-colors ${
                isActive('/profile')
                  ? 'text-[#FF6B35]'
                  : 'text-[#636369] group-hover:text-[#A0A0A8]'
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
