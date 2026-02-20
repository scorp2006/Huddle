"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [linkedinUsername, setLinkedinUsername] = useState('');
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setUser(user);

      // Pre-fill from LinkedIn OAuth data
      // LinkedIn OIDC provides: name, email
      // LinkedIn does NOT provide: profile photo
      const oauthName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
      const oauthAvatar = ''; // LinkedIn OIDC doesn't provide avatar - will show initials

      // Try to extract LinkedIn username from metadata
      const linkedInUsername =
        user.user_metadata?.preferred_username ||
        user.user_metadata?.vanity_name ||
        user.user_metadata?.public_profile_url?.split('/in/')[1]?.split('/')[0] ||
        '';

      setUserName(oauthName);
      setUserAvatar(oauthAvatar);

      // If we got LinkedIn username from OAuth, auto-fill it
      if (linkedInUsername) {
        setLinkedinUsername(linkedInUsername);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user:', error);
      router.push('/');
    }
  };

  const validateLinkedIn = (input: string): string | null => {
    if (!input.trim()) return null;

    // If user pasted a full URL, extract username
    const urlMatch = input.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Validate username format (alphanumeric + hyphens, 3-100 chars)
    const username = input.trim();
    if (username.length < 3 || username.length > 100) {
      return null;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(username)) {
      return null;
    }

    return username;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate LinkedIn username (required)
    if (!linkedinUsername.trim()) {
      setError('LinkedIn username is required');
      return;
    }

    const validatedLinkedIn = validateLinkedIn(linkedinUsername);
    if (!validatedLinkedIn) {
      setError('Please enter a valid LinkedIn username (3-100 characters, alphanumeric and hyphens only)');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Upsert profile with required data
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: userName,
          avatar_url: null, // LinkedIn doesn't provide photos - will show initials
          linkedin_username: validatedLinkedIn,
        });

      if (dbError) throw dbError;

      // Success! Redirect to home
      router.push('/home');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError('Failed to save. Please try again.');
      setIsSaving(false);
    }
  };

  const handleLinkedInChange = (value: string) => {
    setLinkedinUsername(value);
    setError('');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Avatar Preview */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1C1C20] border-2 border-[#2A2A2E]">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#636369] text-2xl font-bold">
                {userName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F7] mb-2">
            Welcome, {userName.split(' ')[0]}!
          </h1>
          <p className="text-[#A0A0A8] text-[15px]">
            LinkedIn username (optional for testing)
          </p>
          <p className="text-[#636369] text-[13px] mt-2">
            Takes 10 seconds. We'll use this to help people connect with you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LinkedIn Username - THE ONLY REQUIRED FIELD */}
          <div>
            <label className="block text-[#F5F5F7] text-[15px] font-semibold mb-3 flex items-center justify-center gap-2">
              Your LinkedIn Username
              <div className="group relative">
                <Info size={16} className="text-[#636369] cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-72 bg-[#141416] border border-[#2A2A2E] rounded-lg p-3 text-[13px] text-[#A0A0A8] shadow-lg z-10">
                  <p className="mb-2">Open LinkedIn app or website → Tap your photo → Look at the URL:</p>
                  <p className="font-mono text-[#F5F5F7]">linkedin.com/in/<strong className="text-[#FF6B35]">your-username</strong></p>
                </div>
              </div>
            </label>

            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636369] text-[15px] pointer-events-none select-none">
                linkedin.com/in/
              </span>
              <input
                type="text"
                value={linkedinUsername}
                onChange={(e) => handleLinkedInChange(e.target.value)}
                autoFocus
                className={`w-full bg-[#1C1C20] border ${error ? 'border-[#FF3B30]' : 'border-[#2A2A2E]'} rounded-lg pl-[140px] pr-4 py-4 text-[#F5F5F7] text-[17px] placeholder:text-[#636369] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all outline-none`}
                placeholder="your-username"
              />
            </div>

            <p className="text-[#636369] text-[13px] text-center">
              You can paste the full URL too — we'll extract it
            </p>

            {error && (
              <div className="mt-3 bg-[#FF3B30]/10 border border-[#FF3B30] rounded-lg p-3 text-[#FF3B30] text-[13px] text-center">
                {error}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving || !linkedinUsername.trim()}
            className="w-full bg-[#FF6B35] hover:bg-[#E85A28] disabled:bg-[#636369] disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-4 text-[17px] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(255,107,53,0.3)]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting you in...
              </>
            ) : (
              "Let's Go →"
            )}
          </button>

          <p className="text-center text-[#636369] text-[11px] mt-4">
            You can add more socials later in your profile
          </p>
        </form>
      </div>
    </main>
  );
}
