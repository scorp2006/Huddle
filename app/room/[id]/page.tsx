"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Users, Search, Eye, Linkedin, ExternalLink, Twitter, Instagram, Github, Globe, TrendingUp } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  linkedin_username: string;
  one_liner: string | null;
  twitter_username: string | null;
  instagram_username: string | null;
  github_username: string | null;
  portfolio_url: string | null;
  view_count?: number;
}

interface Member {
  id: string;
  user_id: string;
  classification_id: string;
  approval_status: string;
  profile: Profile;
  room_classifications: {
    name: string;
    display_order: number;
  };
}

interface Classification {
  id: string;
  name: string;
  requires_approval: boolean;
  display_order: number;
}

export default function RoomPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'viewed'>('recent');
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  useEffect(() => {
    loadRoomAndMembers();
    subscribeToMembers();
  }, [roomId]);

  useEffect(() => {
    filterAndSortMembers();
  }, [members, searchQuery, sortBy, clickCounts, selectedClassification]);

  const loadRoomAndMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setCurrentUserId(user.id);

      // Get room
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (!roomData) {
        router.push('/home');
        return;
      }

      setRoom(roomData);

      // Check if user is a member
      const { data: membership } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        // Not a member, redirect to join page
        router.push(`/join/${roomData.code}`);
        return;
      }

      // Get all members with their profiles
      await loadMembers();

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading room:', error);
      router.push('/home');
    }
  };

  const loadMembers = async () => {
    try {
      // Get room classifications
      const { data: classData } = await supabase
        .from('room_classifications')
        .select('*')
        .eq('room_id', roomId)
        .order('display_order', { ascending: true });

      setClassifications(classData || []);

      // Get all approved room members (without joins)
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('approval_status', 'approved');

      if (memberError) {
        console.error('Error fetching members:', memberError);
        return;
      }

      if (!memberData || memberData.length === 0) {
        setMembers([]);
        return;
      }

      // Get all profiles for these members
      const userIds = memberData.map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      // Get classifications for these members
      const classificationIds = memberData.map(m => m.classification_id);
      const { data: classificationsData } = await supabase
        .from('room_classifications')
        .select('*')
        .in('id', classificationIds);

      // Combine the data
      const membersWithProfiles = memberData.map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        const classification = classificationsData?.find(c => c.id === member.classification_id);

        return {
          ...member,
          profile: profile || {
            id: member.user_id,
            full_name: 'Unknown User',
            avatar_url: null,
            linkedin_username: '',
            one_liner: null,
            twitter_username: null,
            instagram_username: null,
            github_username: null,
            portfolio_url: null,
          },
          room_classifications: classification || {
            name: 'Member',
            display_order: 0,
          },
        };
      });

      // Get click counts for each profile in this room
      const counts: Record<string, number> = {};
      for (const member of memberData) {
        const { count } = await supabase
          .from('linkedin_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', roomId)
          .eq('clicked_user_id', member.user_id);

        counts[member.user_id] = count || 0;
      }

      setClickCounts(counts);
      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const subscribeToMembers = () => {
    const channel = supabase
      .channel(`room_members_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterAndSortMembers = () => {
    let filtered = [...members];

    // Classification filter
    if (selectedClassification !== 'all') {
      filtered = filtered.filter(m => m.classification_id === selectedClassification);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.profile.full_name.toLowerCase().includes(query) ||
        m.profile.one_liner?.toLowerCase().includes(query) ||
        m.profile.linkedin_username.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'viewed') {
      filtered.sort((a, b) => (clickCounts[b.user_id] || 0) - (clickCounts[a.user_id] || 0));
    }
    // 'recent' is already the default order from the query

    setFilteredMembers(filtered);
  };

  const handleLinkedInClick = async (userId: string, linkedinUsername: string) => {
    try {
      // Track the click
      await supabase
        .from('linkedin_clicks')
        .insert({
          room_id: roomId,
          clicked_user_id: userId,
          clicked_by_user_id: currentUserId,
        });

      // Update click count optimistically
      setClickCounts(prev => ({
        ...prev,
        [userId]: (prev[userId] || 0) + 1,
      }));

      // Open LinkedIn
      window.open(`https://linkedin.com/in/${linkedinUsername}`, '_blank');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still open LinkedIn even if tracking fails
      window.open(`https://linkedin.com/in/${linkedinUsername}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  const isExpired = room && new Date() > new Date(room.expires_at);

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-8 pb-24">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#F5F5F7] mb-2">
                {room.name}
              </h1>
              <div className="flex items-center gap-4 text-[13px]">
                {isExpired ? (
                  <span className="text-[#636369]">Room ended</span>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-[#34C759]">
                      <div className="w-2 h-2 rounded-full bg-[#34C759] live-indicator"></div>
                      LIVE
                    </div>
                    <div className="flex items-center gap-1 text-[#A0A0A8]">
                      <Users size={14} />
                      {filteredMembers.length} {filteredMembers.length === 1 ? 'person' : 'people'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {isExpired && (
            <div className="bg-[#FFB800]/10 border border-[#FFB800] rounded-lg p-3 mb-4">
              <p className="text-[#FFB800] text-[13px]">
                This room has ended, but you can still view profiles and connect!
              </p>
            </div>
          )}

          {/* Classification Tabs */}
          {classifications.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              <button
                onClick={() => setSelectedClassification('all')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                  selectedClassification === 'all'
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-[#1C1C20] text-[#A0A0A8] hover:text-[#F5F5F7] border border-[#2A2A2E]'
                }`}
              >
                All ({members.length})
              </button>
              {classifications.map((classification) => {
                const count = members.filter(m => m.classification_id === classification.id).length;
                return (
                  <button
                    key={classification.id}
                    onClick={() => setSelectedClassification(classification.id)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                      selectedClassification === classification.id
                        ? 'bg-[#FF6B35] text-white'
                        : 'bg-[#1C1C20] text-[#A0A0A8] hover:text-[#F5F5F7] border border-[#2A2A2E]'
                    }`}
                  >
                    {classification.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636369]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or bio..."
                className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg pl-11 pr-4 py-3 text-[#F5F5F7] placeholder:text-[#636369] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 transition-all outline-none"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-3 rounded-lg font-semibold text-[13px] transition-all ${
                  sortBy === 'recent'
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-[#1C1C20] text-[#A0A0A8] hover:text-[#F5F5F7] border border-[#2A2A2E]'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('viewed')}
                className={`px-4 py-3 rounded-lg font-semibold text-[13px] transition-all flex items-center gap-1 ${
                  sortBy === 'viewed'
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-[#1C1C20] text-[#A0A0A8] hover:text-[#F5F5F7] border border-[#2A2A2E]'
                }`}
              >
                <TrendingUp size={14} />
                Most Viewed
              </button>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#636369] text-[15px]">
              {searchQuery ? 'No results found' : 'No one else has joined yet. Share the room code!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member, index) => (
              <div
                key={member.id}
                className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-5 hover:border-[#FF6B35]/30 transition-all hover:shadow-[0_0_20px_rgba(255,107,53,0.1)] relative"
                style={{
                  animation: `slide-up-fade 300ms ease-out forwards`,
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                {/* "You" Badge */}
                {member.user_id === currentUserId && (
                  <div className="absolute top-3 right-3 bg-[#FF6B35]/20 text-[#FF6B35] text-[11px] font-bold px-2 py-1 rounded-full">
                    YOU
                  </div>
                )}

                {/* Classification Badge */}
                <div className="absolute top-3 left-3 bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-semibold px-2 py-1 rounded-full">
                  {member.room_classifications.name}
                </div>

                {/* View Count Badge */}
                {clickCounts[member.user_id] > 0 && (
                  <div className="absolute top-10 left-3 bg-[#636369]/80 text-white text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Eye size={10} />
                    {clickCounts[member.user_id]}
                  </div>
                )}

                {/* Avatar */}
                <div className="flex justify-center mb-4 mt-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1C1C20] border-2 border-[#2A2A2E]">
                    {member.profile.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt={member.profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#636369] text-xl font-bold">
                        {member.profile.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-[#F5F5F7] font-bold text-center mb-2 text-[17px]">
                  {member.profile.full_name}
                </h3>

                {/* One-liner */}
                {member.profile.one_liner && (
                  <p className="text-[#A0A0A8] text-center text-[13px] mb-4 line-clamp-2 min-h-[2.6rem]">
                    {member.profile.one_liner}
                  </p>
                )}

                {/* LinkedIn Button - PRIMARY CTA */}
                <button
                  onClick={() => handleLinkedInClick(member.user_id, member.profile.linkedin_username)}
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-lg px-4 py-3 transition-all flex items-center justify-center gap-2 mb-3 shadow-md hover:shadow-lg"
                >
                  <Linkedin size={18} />
                  View on LinkedIn
                  <ExternalLink size={14} />
                </button>

                {/* Other Socials */}
                {(member.profile.twitter_username || member.profile.instagram_username || member.profile.github_username || member.profile.portfolio_url) && (
                  <div className="flex justify-center gap-2 pt-3 border-t border-[#2A2A2E]">
                    {member.profile.twitter_username && (
                      <a
                        href={`https://twitter.com/${member.profile.twitter_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-[#1C1C20] hover:bg-[#1DA1F2]/20 border border-[#2A2A2E] hover:border-[#1DA1F2] flex items-center justify-center transition-all"
                      >
                        <Twitter size={14} className="text-[#1DA1F2]" />
                      </a>
                    )}
                    {member.profile.instagram_username && (
                      <a
                        href={`https://instagram.com/${member.profile.instagram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-[#1C1C20] hover:bg-[#E4405F]/20 border border-[#2A2A2E] hover:border-[#E4405F] flex items-center justify-center transition-all"
                      >
                        <Instagram size={14} className="text-[#E4405F]" />
                      </a>
                    )}
                    {member.profile.github_username && (
                      <a
                        href={`https://github.com/${member.profile.github_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-[#1C1C20] hover:bg-[#F5F5F7]/20 border border-[#2A2A2E] hover:border-[#F5F5F7] flex items-center justify-center transition-all"
                      >
                        <Github size={14} className="text-[#F5F5F7]" />
                      </a>
                    )}
                    {member.profile.portfolio_url && (
                      <a
                        href={member.profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-[#1C1C20] hover:bg-[#5AC8FA]/20 border border-[#2A2A2E] hover:border-[#5AC8FA] flex items-center justify-center transition-all"
                      >
                        <Globe size={14} className="text-[#5AC8FA]" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
