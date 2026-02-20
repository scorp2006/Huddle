"use client";

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error signing in:', error.message);
        alert('Failed to sign in. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Logo Icon - Overlapping Circles */}
        <div className="relative w-16 h-16 mb-6">
          {/* Main circle cluster representing people huddling */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#FF6B35]"
            style={{
              animation: "float-in 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
              animationDelay: "0ms",
              opacity: 0,
              "--float-from-x": "-10px",
              "--float-from-y": "-10px",
            } as React.CSSProperties}
          />
          <div
            className="absolute bottom-0 left-0 w-7 h-7 rounded-full bg-[#FF6B35] opacity-80"
            style={{
              animation: "float-in 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
              animationDelay: "100ms",
              opacity: 0,
              "--float-from-x": "-15px",
              "--float-from-y": "10px",
            } as React.CSSProperties}
          />
          <div
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#FF6B35] opacity-80"
            style={{
              animation: "float-in 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
              animationDelay: "200ms",
              opacity: 0,
              "--float-from-x": "15px",
              "--float-from-y": "10px",
            } as React.CSSProperties}
          />
          <div
            className="absolute top-2 right-1 w-4 h-4 rounded-full bg-[#E85A28]"
            style={{
              animation: "float-in 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
              animationDelay: "300ms",
              opacity: 0,
              "--float-from-x": "12px",
              "--float-from-y": "-8px",
            } as React.CSSProperties}
          />
        </div>

        {/* Animated Wordmark - "Huddle." */}
        <h1 className="mb-4 flex items-baseline justify-center" style={{ fontSize: "clamp(48px, 12vw, 96px)" }}>
          {["H", "u", "d", "d", "l", "e"].map((letter, index) => (
            <span
              key={index}
              className="letter-animate inline-block text-[#F5F5F7]"
              style={{
                fontWeight: 900,
                animationDelay: `${400 + index * 80}ms`,
              }}
            >
              {letter}
            </span>
          ))}
          <span
            className="bounce-animate inline-block text-[#FF6B35]"
            style={{
              fontWeight: 900,
              fontSize: "1em",
              animationDelay: "880ms",
            }}
          >
            .
          </span>
        </h1>

        {/* Tagline */}
        <p
          className="text-[#A0A0A8] text-lg mb-8"
          style={{
            animation: "slide-up-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: "1200ms",
            opacity: 0,
            transform: "translateY(10px)",
          }}
        >
          Never miss a connection.
        </p>

        {/* LinkedIn Sign In */}
        <button
          className="group bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-lg px-8 py-3 flex items-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            animation: "slide-up-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: "1400ms",
            opacity: 0,
          }}
          onClick={handleLinkedInSignIn}
          disabled={isLoading}
        >
          {!isLoading ? (
            <>
              {/* LinkedIn Icon SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>Sign in with LinkedIn</span>
            </>
          ) : (
            <span>Signing in...</span>
          )}
        </button>

        {/* Helper Text */}
        <p
          className="text-[#636369] text-[13px]"
          style={{
            animation: "slide-up-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: "1600ms",
            opacity: 0,
          }}
        >
          Securely sign in with your professional profile
        </p>

        {/* Legal Footer */}
        <div
          className="mt-12 flex items-center justify-center gap-4 text-[11px] text-[#636369]"
          style={{
            animation: "slide-up-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: "1800ms",
            opacity: 0,
          }}
        >
          <a href="/privacy" className="hover:text-[#A0A0A8] transition-colors">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="/terms" className="hover:text-[#A0A0A8] transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </main>
  );
}
