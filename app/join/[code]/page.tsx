"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Users, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface Classification {
  id: string;
  name: string;
  requires_approval: boolean;
  display_order: number;
}

export default function JoinCodePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [error, setError] = useState('');
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<'approved' | 'pending' | null>(null);
  const [attendeeCount, setAttendeeCount] = useState(0);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();

  useEffect(() => {
    checkRoomAndUser();
  }, [code]);

  const checkRoomAndUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Find room by code
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (roomError || !roomData) {
        setError('Room not found. Please check the code and try again.');
        setIsLoading(false);
        return;
      }

      // Check if room has expired
      const now = new Date();
      const expiresAt = new Date(roomData.expires_at);

      if (now > expiresAt) {
        setError(`This room has ended. It was active for ${roomData.name}.`);
        setRoom(roomData);
        setIsLoading(false);
        return;
      }

      setRoom(roomData);

      // Get classifications for this room
      const { data: classData } = await supabase
        .from('room_classifications')
        .select('*')
        .eq('room_id', roomData.id)
        .order('display_order', { ascending: true });

      setClassifications(classData || []);

      // Auto-select first classification if only one
      if (classData && classData.length === 1) {
        setSelectedClassification(classData[0].id);
      }

      // Get approved attendee count
      const { count } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomData.id)
        .eq('approval_status', 'approved');

      setAttendeeCount(count || 0);

      // If not authenticated, show sign-in prompt
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check if user profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('linkedin_username')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push(`/onboarding?redirect=/join/${code}`);
        return;
      }

      // Check if already a member
      const { data: membership } = await supabase
        .from('room_members')
        .select('*, room_classifications(*)')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .single();

      if (membership) {
        setAlreadyJoined(true);
        setMembershipStatus(membership.approval_status);
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Error checking room:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!selectedClassification) {
      setError('Please select a role');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/?redirect=/join/${code}`);
        return;
      }

      // Get selected classification details
      const classification = classifications.find(c => c.id === selectedClassification);
      if (!classification) throw new Error('Invalid classification');

      // Create membership
      const { error: joinError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          classification_id: selectedClassification,
          approval_status: classification.requires_approval ? 'pending' : 'approved',
        });

      if (joinError) throw joinError;

      // If auto-approved, redirect to room
      if (!classification.requires_approval) {
        router.push(`/room/${room.id}`);
      } else {
        // Show pending message
        setAlreadyJoined(true);
        setMembershipStatus('pending');
        setIsJoining(false);
      }
    } catch (error: any) {
      console.error('Error joining room:', error);
      setError(error.message || 'Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  if (error && !room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#F5F5F7] mb-2">Unable to Join</h1>
          <p className="text-[#A0A0A8] mb-6">{error}</p>
          <button
            onClick={() => router.push('/home')}
            className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E85A28] text-white rounded-lg font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  // Already joined - show status
  if (alreadyJoined) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
        <div className="max-w-md w-full text-center">
          {membershipStatus === 'approved' ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#F5F5F7] mb-2">You're In!</h1>
              <p className="text-[#A0A0A8] mb-6">You've already joined {room?.name}</p>
              <button
                onClick={() => router.push(`/room/${room.id}`)}
                className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E85A28] text-white rounded-lg font-medium transition-colors"
              >
                View Room
              </button>
            </>
          ) : (
            <>
              <Clock className="w-16 h-16 text-[#FF6B35] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#F5F5F7] mb-2">Pending Approval</h1>
              <p className="text-[#A0A0A8] mb-6">
                Your request to join {room?.name} is waiting for organizer approval.
              </p>
              <button
                onClick={() => router.push('/home')}
                className="px-6 py-3 bg-[#1C1C20] hover:bg-[#2A2A2E] text-[#F5F5F7] rounded-lg font-medium transition-colors border border-[#2A2A2E]"
              >
                Go Home
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Room Info */}
        <div className="bg-[#1C1C20] rounded-2xl p-6 border border-[#2A2A2E] mb-6">
          <h1 className="text-2xl font-bold text-[#F5F5F7] mb-4">{room?.name}</h1>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-[#A0A0A8]">
              <Calendar className="w-4 h-4" />
              <span>{new Date(room?.starts_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-[#A0A0A8]">
              <Users className="w-4 h-4" />
              <span>{attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} joined</span>
            </div>
            <div className="flex items-center gap-2 text-[#636369]">
              <span className="font-mono text-xs">{code}</span>
            </div>
          </div>
        </div>

        {/* Classification Selection */}
        <div className="bg-[#1C1C20] rounded-2xl p-6 border border-[#2A2A2E]">
          <h2 className="text-lg font-semibold text-[#F5F5F7] mb-4">Select Your Role</h2>

          <div className="space-y-2 mb-6">
            {classifications.map((classification) => (
              <label
                key={classification.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedClassification === classification.id
                    ? 'border-[#FF6B35] bg-[#FF6B35]/5'
                    : 'border-[#2A2A2E] hover:border-[#636369]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="classification"
                    value={classification.id}
                    checked={selectedClassification === classification.id}
                    onChange={(e) => setSelectedClassification(e.target.value)}
                    className="w-4 h-4 text-[#FF6B35] bg-[#0A0A0B] border-[#2A2A2E] focus:ring-[#FF6B35]"
                  />
                  <div>
                    <p className="text-[#F5F5F7] font-medium">{classification.name}</p>
                    {classification.requires_approval && (
                      <p className="text-[#636369] text-xs mt-0.5">Requires organizer approval</p>
                    )}
                  </div>
                </div>
                {!classification.requires_approval && (
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                    Instant
                  </span>
                )}
              </label>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={isJoining || !selectedClassification}
            className="w-full px-6 py-3 bg-[#FF6B35] hover:bg-[#E85A28] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
