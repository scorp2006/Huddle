"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Calendar, Clock } from 'lucide-react';

export default function CreateRoomPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    starts_at: '',
    duration_hours: 8,
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkPermissions();
    // Set default start time to now
    const now = new Date();
    now.setMinutes(0, 0, 0); // Round to nearest hour
    setFormData(prev => ({
      ...prev,
      starts_at: now.toISOString().slice(0, 16), // Format for datetime-local input
    }));
  }, []);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // For MVP, anyone can create rooms (or check role if you want restrictions)
      // If you want to restrict: only admin/organizer can create
      const isAllowed = profile?.role === 'admin' || profile?.role === 'organizer' || true; // Set to true for MVP

      setCanCreate(isAllowed);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setIsLoading(false);
    }
  };

  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Event name is required');
      return;
    }

    if (!formData.starts_at) {
      setError('Start date/time is required');
      return;
    }

    if (formData.duration_hours < 1 || formData.duration_hours > 72) {
      setError('Duration must be between 1 and 72 hours');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Generate unique code
      let code = generateRoomCode();
      let isUnique = false;

      // Ensure code is unique
      while (!isUnique) {
        const { data: existing } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();

        if (!existing) {
          isUnique = true;
        } else {
          code = generateRoomCode();
        }
      }

      // Calculate expiration (starts_at + duration * 2)
      const startsAt = new Date(formData.starts_at);
      const expiresAt = new Date(startsAt.getTime() + (formData.duration_hours * 2 * 60 * 60 * 1000));

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: formData.name.trim(),
          code: code,
          created_by: user.id,
          starts_at: startsAt.toISOString(),
          duration_hours: formData.duration_hours,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Auto-join the creator to the room
      await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
        });

      // Redirect to room share page
      router.push(`/room/${room.id}/share`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(error.message || 'Failed to create room. Please try again.');
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  if (!canCreate) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#F5F5F7] mb-3">Access Restricted</h1>
          <p className="text-[#A0A0A8] mb-6">
            Only event organizers can create rooms. Contact an admin if you need access.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="bg-[#FF6B35] hover:bg-[#E85A28] text-white font-semibold rounded-lg px-6 py-3 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-8 pb-24">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F7] mb-2">
            Create Event Room
          </h1>
          <p className="text-[#A0A0A8] text-[15px]">
            Set up a networking room for your event
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div>
            <label className="block text-[#F5F5F7] text-[15px] font-semibold mb-2">
              Event Name <span className="text-[#FF6B35]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] placeholder:text-[#636369] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 transition-all outline-none"
              placeholder="HackXYZ 2026"
              maxLength={100}
              autoFocus
            />
            <p className="text-[#636369] text-[13px] mt-1">
              The name attendees will see when they join
            </p>
          </div>

          {/* Start Date/Time */}
          <div>
            <label className="block text-[#F5F5F7] text-[15px] font-semibold mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Start Date & Time <span className="text-[#FF6B35]">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
              className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 transition-all outline-none"
            />
            <p className="text-[#636369] text-[13px] mt-1">
              When your event starts
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[#F5F5F7] text-[15px] font-semibold mb-2 flex items-center gap-2">
              <Clock size={16} />
              Duration (hours) <span className="text-[#FF6B35]">*</span>
            </label>
            <input
              type="number"
              value={formData.duration_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 8 }))}
              min={1}
              max={72}
              className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 transition-all outline-none"
            />
            <p className="text-[#636369] text-[13px] mt-1">
              Room will stay open for 2x this duration (auto-expires after {formData.duration_hours * 2} hours)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-4">
            <h3 className="text-[#F5F5F7] font-semibold mb-2 text-[15px]">What happens next?</h3>
            <ul className="space-y-2 text-[#A0A0A8] text-[13px]">
              <li className="flex items-start gap-2">
                <span className="text-[#FF6B35] mt-0.5">•</span>
                <span>We'll generate a unique join code and QR code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF6B35] mt-0.5">•</span>
                <span>Share the QR with attendees at your event</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF6B35] mt-0.5">•</span>
                <span>They scan, sign in, and connect with everyone instantly</span>
              </li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#FF3B30]/10 border border-[#FF3B30] rounded-lg p-3 text-[#FF3B30] text-[13px]">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-[#FF6B35] hover:bg-[#E85A28] disabled:bg-[#636369] disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-4 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(255,107,53,0.3)]"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Room...
              </>
            ) : (
              'Create Room →'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
