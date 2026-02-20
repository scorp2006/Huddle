"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Users, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, QrCode } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  joined_at: string;
  classification_id: string;
  profiles: {
    full_name: string;
    linkedin_username: string;
    email: string;
  };
  room_classifications: {
    name: string;
  };
}

interface Classification {
  id: string;
  name: string;
  requires_approval: boolean;
  display_order: number;
}

export default function OrganizerRoomPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  useEffect(() => {
    loadRoomData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`room-${roomId}-members`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          loadRoomData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      // Verify user is an organizer
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Get room details
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*, organizations(name)')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        router.push('/organizer');
        return;
      }

      setRoom(roomData);

      // Generate QR code URL
      const joinUrl = `${window.location.origin}/join/${roomData.code}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`);

      // Get classifications
      const { data: classData } = await supabase
        .from('room_classifications')
        .select('*')
        .eq('room_id', roomId)
        .order('display_order', { ascending: true });

      setClassifications(classData || []);

      // Get members (without joins)
      const { data: membersData, error: membersError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: false });

      if (membersError) {
        console.error('Error fetching members:', membersError);
        setIsLoading(false);
        return;
      }

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        setIsLoading(false);
        return;
      }

      // Get all profiles for these members
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, linkedin_username')
        .in('id', userIds);

      // Get email from auth.users (need to fetch separately or use RPC)
      // For now, we'll use the profiles table which should have the data we need

      // Get classifications for these members
      const classificationIds = membersData.map(m => m.classification_id);
      const { data: classificationsData } = await supabase
        .from('room_classifications')
        .select('id, name')
        .in('id', classificationIds);

      // Combine the data
      const membersWithDetails = membersData.map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        const classification = classificationsData?.find(c => c.id === member.classification_id);

        return {
          ...member,
          profiles: {
            full_name: profile?.full_name || 'Unknown User',
            linkedin_username: profile?.linkedin_username || '',
            email: '', // We don't have email in profiles, organizers don't need it
          },
          room_classifications: {
            name: classification?.name || 'Member',
          },
        };
      });

      setMembers(membersWithDetails);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading room:', error);
      setIsLoading(false);
    }
  };

  const handleApproval = async (memberId: string, status: 'approved' | 'rejected') => {
    setProcessingMemberId(memberId);

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ approval_status: status })
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setMembers(prev =>
        prev.map(m =>
          m.id === memberId
            ? { ...m, approval_status: status }
            : m
        )
      );
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Failed to update approval status');
    } finally {
      setProcessingMemberId(null);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  const pendingMembers = members.filter(m => m.approval_status === 'pending');
  const approvedMembers = members.filter(m => m.approval_status === 'approved');
  const rejectedMembers = members.filter(m => m.approval_status === 'rejected');

  const isRoomLive = () => {
    const now = new Date();
    const starts = new Date(room.starts_at);
    const expires = new Date(room.expires_at);
    return now >= starts && now <= expires;
  };

  const isRoomExpired = () => {
    return new Date() > new Date(room.expires_at);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-8 pb-24">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/organizer')}
            className="flex items-center gap-2 text-[#A0A0A8] hover:text-[#F5F5F7] mb-4 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#F5F5F7] mb-2">{room.name}</h1>
              <div className="flex items-center gap-4 text-sm text-[#A0A0A8]">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(room.starts_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {room.duration_hours}h duration
                </div>
                <span className="font-mono text-[#636369]">{room.code}</span>
              </div>
            </div>

            {/* Status Badge */}
            {isRoomLive() && (
              <div className="flex items-center gap-1 text-[#34C759] text-sm font-bold bg-[#34C759]/10 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-[#34C759] live-indicator"></div>
                LIVE
              </div>
            )}
            {isRoomExpired() && (
              <div className="text-[#636369] text-sm font-bold bg-[#636369]/10 px-3 py-1.5 rounded-full">
                ENDED
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-4">
            <div className="text-[#A0A0A8] text-sm mb-1">Approved</div>
            <div className="text-2xl font-bold text-[#34C759]">{approvedMembers.length}</div>
          </div>
          <div className="bg-[#1C1C20] border border-[#FF6B35]/20 rounded-xl p-4">
            <div className="text-[#A0A0A8] text-sm mb-1">Pending</div>
            <div className="text-2xl font-bold text-[#FF6B35]">{pendingMembers.length}</div>
          </div>
          <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-4">
            <div className="text-[#A0A0A8] text-sm mb-1">Total</div>
            <div className="text-2xl font-bold text-[#F5F5F7]">{members.length}</div>
          </div>
        </div>

        {/* QR Code Button */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full bg-[#1C1C20] hover:bg-[#2A2A2E] border border-[#2A2A2E] rounded-xl p-4 mb-6 transition-colors flex items-center justify-center gap-2 text-[#F5F5F7]"
        >
          <QrCode size={20} />
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>

        {showQR && (
          <div className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-6 mb-6 text-center">
            <img src={qrCodeUrl} alt="Room QR Code" className="mx-auto rounded-lg mb-4" />
            <p className="text-[#A0A0A8] text-sm">
              Scan to join: <span className="font-mono text-[#F5F5F7]">{room.code}</span>
            </p>
          </div>
        )}

        {/* Pending Approvals */}
        {pendingMembers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#F5F5F7] mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-[#FF6B35]" />
              Pending Approvals ({pendingMembers.length})
            </h2>
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-[#1C1C20] border border-[#FF6B35]/30 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-[#F5F5F7] font-bold text-lg mb-1">
                        {member.profiles.full_name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-[#A0A0A8]">
                        <span>{member.profiles.email}</span>
                        {member.profiles.linkedin_username && (
                          <span>@{member.profiles.linkedin_username}</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#FF6B35]/10 text-[#FF6B35] px-3 py-1 rounded-full text-xs font-medium">
                      {member.room_classifications.name}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproval(member.id, 'approved')}
                      disabled={processingMemberId === member.id}
                      className="flex-1 bg-[#34C759] hover:bg-[#2BA84A] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingMemberId === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleApproval(member.id, 'rejected')}
                      disabled={processingMemberId === member.id}
                      className="flex-1 bg-[#1C1C20] hover:bg-[#2A2A2E] text-red-400 border border-red-400/30 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingMemberId === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle size={18} />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Members by Classification */}
        {approvedMembers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#F5F5F7] mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-[#34C759]" />
              Approved Members ({approvedMembers.length})
            </h2>

            {classifications.map((classification) => {
              const classMembers = approvedMembers.filter(
                m => m.classification_id === classification.id
              );

              if (classMembers.length === 0) return null;

              return (
                <div key={classification.id} className="mb-6">
                  <h3 className="text-[#A0A0A8] text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users size={16} />
                    {classification.name} ({classMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {classMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-[#141416] border border-[#2A2A2E] rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-[#F5F5F7] font-semibold">
                              {member.profiles.full_name}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-[#636369] mt-1">
                              <span>{member.profiles.email}</span>
                              {member.profiles.linkedin_username && (
                                <a
                                  href={`https://linkedin.com/in/${member.profiles.linkedin_username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-[#FF6B35] transition-colors"
                                >
                                  @{member.profiles.linkedin_username}
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-[#636369]">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rejected Members (collapsed) */}
        {rejectedMembers.length > 0 && (
          <div>
            <details className="bg-[#1C1C20] border border-[#2A2A2E] rounded-xl p-5">
              <summary className="cursor-pointer text-[#636369] font-semibold flex items-center gap-2">
                <XCircle size={18} />
                Rejected ({rejectedMembers.length})
              </summary>
              <div className="mt-4 space-y-2">
                {rejectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg p-3 opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[#A0A0A8] font-medium">
                          {member.profiles.full_name}
                        </h4>
                        <span className="text-xs text-[#636369]">
                          {member.room_classifications.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleApproval(member.id, 'approved')}
                        className="text-xs text-[#34C759] hover:underline"
                      >
                        Re-approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Empty State */}
        {members.length === 0 && (
          <div className="text-center py-16 bg-[#1C1C20] border border-[#2A2A2E] rounded-2xl">
            <Users size={48} className="text-[#636369] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#F5F5F7] mb-2">No members yet</h3>
            <p className="text-[#A0A0A8] mb-6">
              Share the room code or QR code to get started
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
