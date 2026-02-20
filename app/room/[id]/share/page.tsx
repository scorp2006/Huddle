"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Share2, Copy, Check, Users, Eye } from 'lucide-react';

export default function RoomSharePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  useEffect(() => {
    loadRoom();
    subscribeToAttendees();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      // Get room details
      const { data: roomData, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !roomData) {
        console.error('Room not found:', error);
        router.push('/home');
        return;
      }

      setRoom(roomData);

      // Get attendee count
      const { count } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      setAttendeeCount(count || 0);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading room:', error);
      router.push('/home');
    }
  };

  const subscribeToAttendees = () => {
    const channel = supabase
      .channel(`room_members:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refetch count when changes occur
          supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', roomId)
            .then(({ count }) => setAttendeeCount(count || 0));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getJoinUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/join/${room.code}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getJoinUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: room.name,
      text: `Join ${room.name} on Huddle! Use code: ${room.code}`,
      url: getJoinUrl(),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const formatCode = (code: string) => {
    // Format as H U D - X 4 K for readability
    return code.split('').join(' ');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
        <p className="text-[#A0A0A8]">Room not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F7] mb-2">
            {room.name}
          </h1>
          <p className="text-[#A0A0A8] text-[15px]">
            Share this with your event attendees
          </p>
        </div>

        {/* Live Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#34C759] live-indicator"></div>
              <span className="text-[#34C759] text-[13px] font-semibold">LIVE</span>
            </div>
            <div className="text-3xl font-bold text-[#F5F5F7]">{attendeeCount}</div>
            <div className="text-[#636369] text-[13px] flex items-center gap-1 justify-center">
              <Users size={12} />
              {attendeeCount === 1 ? 'person' : 'people'} joined
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-2xl p-8 mb-6 border-4 border-[#FF6B35]">
          <div className="flex flex-col items-center">
            {/* QR Code */}
            <div className="mb-6">
              <QRCodeSVG
                value={getJoinUrl()}
                size={280}
                level="H"
                includeMargin={true}
                fgColor="#0A0A0B"
                bgColor="#FFFFFF"
              />
            </div>

            {/* Join Code */}
            <div className="text-center mb-4">
              <p className="text-[#636369] text-[13px] mb-2">Or enter code manually:</p>
              <div className="font-mono text-4xl font-bold tracking-[0.3em] text-[#0A0A0B]">
                {formatCode(room.code)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleShare}
            className="w-full bg-[#FF6B35] hover:bg-[#E85A28] text-white font-semibold rounded-lg px-6 py-4 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Share2 size={20} />
            Share Link
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full bg-[#141416] border border-[#2A2A2E] hover:bg-[#1C1C20] text-[#F5F5F7] font-semibold rounded-lg px-6 py-3 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={18} className="text-[#34C759]" />
                <span className="text-[#34C759]">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Link
              </>
            )}
          </button>

          <button
            onClick={() => router.push(`/room/${roomId}`)}
            className="w-full bg-transparent border border-[#2A2A2E] hover:bg-[#141416] text-[#F5F5F7] font-semibold rounded-lg px-6 py-3 transition-all flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            View Room
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
          <h3 className="text-[#F5F5F7] font-semibold mb-3">How to use:</h3>
          <ol className="space-y-2 text-[#A0A0A8] text-[15px]">
            <li className="flex gap-3">
              <span className="text-[#FF6B35] font-bold min-w-[20px]">1.</span>
              <span>Project this QR code on a screen at your event</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#FF6B35] font-bold min-w-[20px]">2.</span>
              <span>Attendees scan with their phone camera</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#FF6B35] font-bold min-w-[20px]">3.</span>
              <span>They sign in with Google and enter their LinkedIn</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#FF6B35] font-bold min-w-[20px]">4.</span>
              <span>Everyone can now see and connect with each other!</span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
