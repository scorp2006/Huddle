"use client";

import { createClient } from '@/lib/supabase/client';
import { isEventOrganizer, isSuperAdmin } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Users, Calendar, Loader2, QrCode, Settings, BarChart } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
}

interface Room {
  id: string;
  name: string;
  code: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  approved_count?: number;
  pending_count?: number;
}

export default function EventOrganizerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAccessAndLoadData();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadRooms();

      // Subscribe to room_members changes for real-time updates
      const channel = supabase
        .channel(`org-${selectedOrgId}-rooms`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_members',
          },
          () => {
            // Reload rooms when any member joins/leaves/gets approved
            loadRooms();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedOrgId]);

  const checkAccessAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Get user role and organizations
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || (!isEventOrganizer(profile.role) && !isSuperAdmin(profile.role))) {
        router.push('/home');
        return;
      }

      // Load organizations this user is an organizer for
      const { data: orgData, error } = await supabase
        .from('event_organizers')
        .select(`
          organization_id,
          organizations (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const orgs = (orgData?.map((item: any) => item.organizations as Organization).filter(Boolean) || []) as Organization[];
      setOrganizations(orgs);

      if (orgs.length > 0) {
        setSelectedOrgId(orgs[0].id);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/home');
    }
  };

  const loadRooms = async () => {
    try {
      // Get all rooms for this organization
      const { data: roomsData, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('organization_id', selectedOrgId)
        .order('created_at', { ascending: false});

      if (error) throw error;

      // Get member counts for each room
      const roomsWithStats = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count: approvedCount } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('approval_status', 'approved');

          const { count: pendingCount } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('approval_status', 'pending');

          return {
            ...room,
            approved_count: approvedCount || 0,
            pending_count: pendingCount || 0,
          };
        })
      );

      setRooms(roomsWithStats);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  if (organizations.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-[#636369] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#F5F5F7] mb-2">No Organizations Assigned</h2>
          <p className="text-[#A0A0A8] mb-6">
            You haven't been assigned to any organizations yet. Contact your super admin to get access.
          </p>
        </div>
      </main>
    );
  }

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  return (
    <main className="min-h-screen bg-[#0A0A0B] pb-20">
      {/* Header */}
      <div className="bg-[#1C1C20] border-b border-[#2A2A2E] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F7]">Event Dashboard</h1>
              <p className="text-[#A0A0A8] text-sm mt-1">Manage your event rooms</p>
            </div>
            <button
              onClick={() => router.push(`/organizer/create?org=${selectedOrgId}`)}
              className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85A28] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
          </div>

          {/* Organization Selector */}
          {organizations.length > 1 && (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-2 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Organization Info */}
        {selectedOrg && (
          <div className="bg-[#1C1C20] rounded-xl p-6 border border-[#2A2A2E] mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {selectedOrg.logo_url ? (
                  <img src={selectedOrg.logo_url} alt={selectedOrg.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-[#FF6B35]" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-[#F5F5F7]">{selectedOrg.name}</h2>
                  {selectedOrg.description && (
                    <p className="text-[#A0A0A8] mt-1">{selectedOrg.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rooms List */}
        <div>
          <h3 className="text-xl font-bold text-[#F5F5F7] mb-4">Rooms</h3>

          {rooms.length === 0 ? (
            <div className="bg-[#1C1C20] rounded-xl p-12 text-center border border-[#2A2A2E]">
              <Calendar className="w-12 h-12 text-[#636369] mx-auto mb-4" />
              <p className="text-[#A0A0A8] mb-4">No rooms created yet</p>
              <button
                onClick={() => router.push(`/organizer/create?org=${selectedOrgId}`)}
                className="text-[#FF6B35] hover:text-[#E85A28] font-medium"
              >
                Create your first room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} orgSlug={selectedOrg?.slug || ''} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Room Card Component
function RoomCard({ room, orgSlug }: { room: Room; orgSlug: string }) {
  const router = useRouter();
  const isExpired = new Date(room.expires_at) < new Date();
  const startDate = new Date(room.starts_at);

  return (
    <div
      onClick={() => router.push(`/organizer/room/${room.id}`)}
      className="bg-[#1C1C20] rounded-xl p-6 border border-[#2A2A2E] hover:border-[#FF6B35]/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-[#F5F5F7] font-semibold group-hover:text-[#FF6B35] transition-colors mb-1">
            {room.name}
          </h3>
          <p className="text-[#636369] text-sm font-mono">{room.code}</p>
        </div>
        {isExpired ? (
          <span className="px-2 py-1 bg-[#636369]/10 text-[#636369] text-xs rounded-md">
            Expired
          </span>
        ) : (
          <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-md">
            Active
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-[#A0A0A8]">
          <Calendar className="w-4 h-4" />
          <span>{startDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-[#A0A0A8]">
          <Users className="w-4 h-4" />
          <span>{room.approved_count} members</span>
          {room.pending_count > 0 && (
            <span className="px-2 py-0.5 bg-[#FF6B35]/10 text-[#FF6B35] text-xs rounded">
              {room.pending_count} pending
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/room/${room.id}/share`);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0A0A0B] hover:bg-[#2A2A2E] text-[#A0A0A8] hover:text-[#F5F5F7] rounded-lg transition-colors text-sm"
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/organizer/room/${room.id}`);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0A0A0B] hover:bg-[#2A2A2E] text-[#A0A0A8] hover:text-[#F5F5F7] rounded-lg transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          Manage
        </button>
      </div>
    </div>
  );
}
