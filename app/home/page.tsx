"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Users, Calendar, Clock, ChevronRight, ScanLine } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  code: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  member_count?: number;
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/');
        return;
      }

      setUser(authUser);

      // Get user profile with role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profileData) {
        router.push('/onboarding');
        return;
      }

      // Route based on role
      if (profileData.role === 'super_admin') {
        router.push('/admin');
        return;
      }

      if (profileData.role === 'event_organizer') {
        router.push('/organizer');
        return;
      }

      // Continue loading for regular users
      setProfile(profileData);

      // Get rooms user has joined
      const { data: memberData } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', authUser.id);

      if (memberData && memberData.length > 0) {
        const roomIds = memberData.map(m => m.room_id);

        // Get room details
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('*')
          .in('id', roomIds)
          .order('created_at', { ascending: false });

        if (roomsData) {
          // Get member counts for each room
          const roomsWithCounts = await Promise.all(
            roomsData.map(async (room) => {
              const { count } = await supabase
                .from('room_members')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', room.id);

              return { ...room, member_count: count || 0 };
            })
          );

          setRooms(roomsWithCounts);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setIsLoading(false);
    }
  };

  const isRoomExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const isRoomLive = (startsAt: string, expiresAt: string) => {
    const now = new Date();
    return now >= new Date(startsAt) && now <= new Date(expiresAt);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  const activeRooms = rooms.filter(r => !isRoomExpired(r.expires_at));
  const expiredRooms = rooms.filter(r => isRoomExpired(r.expires_at));

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-8 pb-24">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F7] mb-2">
            Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-[#A0A0A8] text-[15px]">
            Your event networking hub
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Join Room */}
          <button
            onClick={() => router.push('/join')}
            className="bg-gradient-to-br from-[#FF6B35] to-[#E85A28] hover:from-[#E85A28] hover:to-[#D04820] text-white rounded-xl p-6 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(255,107,53,0.3)] group"
          >
            <div className="flex items-center justify-between mb-2">
              <ScanLine size={32} className="text-white/90" />
              <ChevronRight size={24} className="text-white/60 group-hover:text-white/90 transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-1">Join Event</h3>
            <p className="text-white/80 text-[13px]">Enter a room code or scan QR</p>
          </button>

        </div>

        {/* Active Rooms */}
        {activeRooms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#F5F5F7] mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#34C759] live-indicator"></div>
              Active Rooms
            </h2>
            <div className="space-y-3">
              {activeRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="w-full bg-[#141416] border border-[#2A2A2E] hover:border-[#FF6B35]/50 rounded-xl p-5 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-[#F5F5F7] font-bold text-[17px] mb-1 group-hover:text-[#FF6B35] transition-colors">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-3 text-[13px] text-[#A0A0A8]">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(room.starts_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          {room.member_count} {room.member_count === 1 ? 'person' : 'people'}
                        </div>
                      </div>
                    </div>
                    {isRoomLive(room.starts_at, room.expires_at) && (
                      <div className="flex items-center gap-1 text-[#34C759] text-[11px] font-bold bg-[#34C759]/10 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] live-indicator"></div>
                        LIVE
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-mono text-[#636369]">Code: {room.code}</span>
                    <ChevronRight size={18} className="text-[#636369] group-hover:text-[#FF6B35] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Expired Rooms */}
        {expiredRooms.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-[#636369] mb-4">Past Events</h2>
            <div className="space-y-3">
              {expiredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="w-full bg-[#0A0A0B] border border-[#2A2A2E] hover:border-[#3A3A40] rounded-xl p-5 transition-all text-left opacity-60 hover:opacity-100 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-[#A0A0A8] font-bold text-[17px] mb-1">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-3 text-[13px] text-[#636369]">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(room.starts_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          {room.member_count} {room.member_count === 1 ? 'person' : 'people'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#636369]">View profiles →</span>
                    <ChevronRight size={18} className="text-[#636369]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {rooms.length === 0 && (
          <div className="text-center py-16 bg-[#141416] border border-[#2A2A2E] rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-[#FF6B35]" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F7] mb-2">
              No rooms yet
            </h3>
            <p className="text-[#A0A0A8] mb-6 max-w-sm mx-auto">
              Join your first event room to start connecting with attendees!
            </p>
            <button
              onClick={() => router.push('/join')}
              className="bg-[#FF6B35] hover:bg-[#E85A28] text-white font-semibold rounded-lg px-6 py-3 transition-colors inline-flex items-center gap-2"
            >
              <ScanLine size={18} />
              Join Event
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
