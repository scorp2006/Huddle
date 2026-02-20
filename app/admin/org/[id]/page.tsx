"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Building2, Users, Calendar, ChevronLeft, Settings, Trash2, Plus, X } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
  created_at: string;
}

interface Organizer {
  id: string;
  user_id: string;
  role: string;
  added_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

interface Room {
  id: string;
  name: string;
  code: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
  member_count: number;
  pending_count: number;
}

export default function OrganizationDetailsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [org, setOrg] = useState<Organization | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;

  useEffect(() => {
    loadOrganizationData();
  }, [orgId]);

  const loadOrganizationData = async () => {
    try {
      // Verify super admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'super_admin') {
        router.push('/home');
        return;
      }

      // Load organization
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (!orgData) {
        router.push('/admin');
        return;
      }

      setOrg(orgData);

      // Load organizers
      const { data: organizersData } = await supabase
        .from('event_organizers')
        .select(`
          *,
          profiles!event_organizers_user_id_fkey (id, full_name, avatar_url, role)
        `)
        .eq('organization_id', orgId);

      setOrganizers(organizersData || []);

      // Load rooms with stats
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (roomsData) {
        const roomsWithStats = await Promise.all(
          roomsData.map(async (room) => {
            const { count: memberCount } = await supabase
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
              member_count: memberCount || 0,
              pending_count: pendingCount || 0,
            };
          })
        );

        setRooms(roomsWithStats);
        setTotalMembers(roomsWithStats.reduce((sum, r) => sum + r.member_count, 0));
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading organization:', error);
      setIsLoading(false);
    }
  };

  const handleRemoveOrganizer = async (organizerId: string) => {
    if (!confirm('Remove this organizer from the organization?')) return;

    try {
      const { error } = await supabase
        .from('event_organizers')
        .delete()
        .eq('id', organizerId);

      if (error) throw error;

      await loadOrganizationData();
    } catch (error) {
      console.error('Error removing organizer:', error);
      alert('Failed to remove organizer');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  if (!org) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="text-center">
          <p className="text-[#A0A0A8] mb-4">Organization not found</p>
          <button
            onClick={() => router.push('/admin')}
            className="text-[#FF6B35] hover:underline"
          >
            Go back to admin dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-8 pb-24">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-[#A0A0A8] hover:text-[#F5F5F7] mb-6 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Organizations
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-20 h-20 rounded-xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-[#FF6B35]" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-[#F5F5F7] mb-1">{org.name}</h1>
                <p className="text-[#A0A0A8]">@{org.slug}</p>
                {org.description && (
                  <p className="text-[#636369] text-sm mt-2 max-w-2xl">{org.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {org.is_active ? (
                <span className="px-3 py-1.5 bg-green-500/10 text-green-400 text-sm rounded-lg font-medium">
                  Active
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-[#636369]/20 text-[#636369] text-sm rounded-lg font-medium">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-5">
            <div className="text-[#A0A0A8] text-sm mb-2">Event Organizers</div>
            <div className="text-3xl font-bold text-[#F5F5F7]">{organizers.length}</div>
          </div>
          <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-5">
            <div className="text-[#A0A0A8] text-sm mb-2">Total Rooms</div>
            <div className="text-3xl font-bold text-[#F5F5F7]">{rooms.length}</div>
          </div>
          <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-5">
            <div className="text-[#A0A0A8] text-sm mb-2">Active Rooms</div>
            <div className="text-3xl font-bold text-[#34C759]">
              {rooms.filter(r => new Date(r.expires_at) > new Date()).length}
            </div>
          </div>
          <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-5">
            <div className="text-[#A0A0A8] text-sm mb-2">Total Members</div>
            <div className="text-3xl font-bold text-[#F5F5F7]">{totalMembers}</div>
          </div>
        </div>

        {/* Contact Info */}
        {(org.contact_email || org.contact_phone) && (
          <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-[#F5F5F7] mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {org.contact_email && (
                <div>
                  <div className="text-[#636369] mb-1">Email</div>
                  <a href={`mailto:${org.contact_email}`} className="text-[#FF6B35] hover:underline">
                    {org.contact_email}
                  </a>
                </div>
              )}
              {org.contact_phone && (
                <div>
                  <div className="text-[#636369] mb-1">Phone</div>
                  <a href={`tel:${org.contact_phone}`} className="text-[#FF6B35] hover:underline">
                    {org.contact_phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Organizers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#F5F5F7]">Event Organizers ({organizers.length})</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#E85A28] text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Add Organizer
            </button>
          </div>

          {organizers.length === 0 ? (
            <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-12 text-center">
              <Users className="w-12 h-12 text-[#636369] mx-auto mb-4" />
              <p className="text-[#A0A0A8]">No organizers assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizers.map((organizer) => (
                <div
                  key={organizer.id}
                  className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2A2A2E]">
                      {organizer.profiles.avatar_url ? (
                        <img
                          src={organizer.profiles.avatar_url}
                          alt={organizer.profiles.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#F5F5F7] font-bold">
                          {organizer.profiles.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[#F5F5F7] font-semibold">
                        {organizer.profiles.full_name}
                      </h3>
                      <p className="text-[#636369] text-sm capitalize">{organizer.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveOrganizer(organizer.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rooms Section */}
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F7] mb-4">Rooms ({rooms.length})</h2>

          {rooms.length === 0 ? (
            <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-12 text-center">
              <Calendar className="w-12 h-12 text-[#636369] mx-auto mb-4" />
              <p className="text-[#A0A0A8]">No rooms created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const isExpired = new Date(room.expires_at) < new Date();
                const isLive =
                  new Date() >= new Date(room.starts_at) && new Date() <= new Date(room.expires_at);

                return (
                  <div
                    key={room.id}
                    className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-5 hover:border-[#FF6B35]/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-[#F5F5F7] font-bold text-lg">{room.name}</h3>
                          {isLive && (
                            <span className="px-2 py-1 bg-[#34C759]/10 text-[#34C759] text-xs font-bold rounded-full">
                              LIVE
                            </span>
                          )}
                          {isExpired && (
                            <span className="px-2 py-1 bg-[#636369]/20 text-[#636369] text-xs font-bold rounded-full">
                              ENDED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#A0A0A8]">
                          <span className="font-mono text-[#636369]">{room.code}</span>
                          <span>{new Date(room.starts_at).toLocaleDateString()}</span>
                          <span>{room.member_count} members</span>
                          {room.pending_count > 0 && (
                            <span className="text-[#FF6B35]">{room.pending_count} pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Organizer Modal */}
        {showAddModal && (
          <AddOrganizerModal
            orgId={orgId}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              loadOrganizationData();
            }}
          />
        )}
      </div>
    </main>
  );
}

// Add Organizer Modal Component
function AddOrganizerModal({
  orgId,
  onClose,
  onSuccess,
}: {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find user by email
      const { data: userId, error: rpcError } = await supabase.rpc('get_user_id_by_email', {
        email_input: email.trim(),
      });

      if (rpcError) throw rpcError;
      if (!userId) {
        setError(`User "${email}" not found. They need to sign in first.`);
        setIsAdding(false);
        return;
      }

      // Check if already an organizer
      const { data: existing } = await supabase
        .from('event_organizers')
        .select('*')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        setError('This user is already an organizer for this organization.');
        setIsAdding(false);
        return;
      }

      // Update role
      const { error: roleError } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: 'event_organizer',
      });

      if (roleError) throw roleError;

      // Add to organization
      const { error: insertError } = await supabase.from('event_organizers').insert({
        organization_id: orgId,
        user_id: userId,
        role: 'organizer',
        added_by: user.id,
      });

      if (insertError) throw insertError;

      alert('✅ Organizer added! They need to sign out and back in to see their new role.');
      onSuccess();
    } catch (err: any) {
      console.error('Error adding organizer:', err);
      setError(err.message || 'Failed to add organizer');
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1C1C20] rounded-2xl max-w-md w-full border border-[#2A2A2E]">
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2E]">
          <h2 className="text-xl font-bold text-[#F5F5F7]">Add Event Organizer</h2>
          <button onClick={onClose} className="text-[#A0A0A8] hover:text-[#F5F5F7]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="p-6">
          <div className="mb-4">
            <label className="block text-[#A0A0A8] text-sm mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@example.com"
              className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
            />
            <p className="text-[#636369] text-xs mt-2">
              User must have signed in to the app at least once
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#2A2A2E] hover:bg-[#3A3A3E] text-[#F5F5F7] rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="flex-1 px-4 py-3 bg-[#FF6B35] hover:bg-[#E85A28] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add Organizer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
