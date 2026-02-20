"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const handleCodeChange = (value: string) => {
    // Auto-uppercase and limit to 6 chars
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
    setCode(cleaned);

    // Auto-submit when 6 chars entered
    if (cleaned.length === 6) {
      handleSubmit(cleaned);
    }
  };

  const handleSubmit = async (submitCode?: string) => {
    const codeToSubmit = submitCode || code;

    if (codeToSubmit.length !== 6) return;

    setIsChecking(true);
    // Redirect to the join/[code] page which handles the actual joining
    router.push(`/join/${codeToSubmit}`);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#F5F5F7] mb-3">
            Join an Event
          </h1>
          <p className="text-[#A0A0A8] text-[17px]">
            Enter the 6-character room code
          </p>
        </div>

        {/* Code Input */}
        <div className="mb-8">
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="ABCDEF"
            autoFocus
            disabled={isChecking}
            className="w-full bg-[#1C1C20] border-2 border-[#2A2A2E] focus:border-[#FF6B35] rounded-2xl px-6 py-6 text-center font-mono text-4xl font-bold tracking-[0.3em] text-[#F5F5F7] placeholder:text-[#636369] placeholder:opacity-30 transition-all outline-none"
            maxLength={6}
          />
          <p className="text-center text-[#636369] text-[13px] mt-3">
            {code.length}/6 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={code.length !== 6 || isChecking}
          className="w-full bg-[#FF6B35] hover:bg-[#E85A28] disabled:bg-[#636369] disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-4 text-[17px] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(255,107,53,0.3)]"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Checking...
            </>
          ) : (
            'Join Room →'
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[#2A2A2E]"></div>
          <span className="text-[#636369] text-[13px]">or</span>
          <div className="flex-1 h-px bg-[#2A2A2E]"></div>
        </div>

        {/* Scan QR Option */}
        <button
          onClick={() => router.push('/home')}
          className="w-full bg-transparent border border-[#2A2A2E] hover:bg-[#141416] text-[#F5F5F7] font-semibold rounded-lg px-6 py-3 transition-all"
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
