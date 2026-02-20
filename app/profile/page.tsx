"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Linkedin, Twitter, Instagram, Github, Globe, Loader2, LogOut, Eye } from 'lucide-react';

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [totalViews, setTotalViews] = useState(0);
  const [editData, setEditData] = useState<any>({});

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setUser(user);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditData(profileData);

        // Get LinkedIn click count
        const { count } = await supabase
          .from('linkedin_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('clicked_user_id', user.id);

        setTotalViews(count || 0);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          linkedin_username: editData.linkedin_username,
          one_liner: editData.one_liner || null,
          twitter_username: editData.twitter_username || null,
          instagram_username: editData.instagram_username || null,
          github_username: editData.github_username || null,
          portfolio_url: editData.portfolio_url || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
        <div className="text-center">
          <p className="text-[#A0A0A8] mb-4">Profile not found</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="bg-[#FF6B35] hover:bg-[#E85A28] text-white font-semibold rounded-lg px-6 py-3"
          >
            Complete Setup
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] px-6 py-8 pb-24">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F7]">Profile</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-[#FF6B35] hover:text-[#E85A28] font-semibold transition-colors"
            >
              <Edit2 size={18} />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData(profile);
                }}
                className="text-[#A0A0A8] hover:text-[#F5F5F7] font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#FF6B35] hover:bg-[#E85A28] disabled:bg-[#636369] text-white font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 mb-6">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1C1C20] border-2 border-[#2A2A2E] mb-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#636369] text-2xl font-bold">
                  {profile.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {isEditing ? (
              <input
                type="text"
                value={editData.full_name}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                className="w-full text-center text-2xl font-bold bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-2 text-[#F5F5F7] mb-2"
              />
            ) : (
              <h2 className="text-2xl font-bold text-[#F5F5F7] mb-2">{profile.full_name}</h2>
            )}

            {isEditing ? (
              <input
                type="text"
                value={editData.one_liner || ''}
                onChange={(e) => setEditData({ ...editData, one_liner: e.target.value })}
                className="w-full text-center bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-2 text-[#A0A0A8]"
                placeholder="What are you building?"
              />
            ) : (
              profile.one_liner && (
                <p className="text-[#A0A0A8] text-center text-[15px]">{profile.one_liner}</p>
              )
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 py-4 border-t border-[#2A2A2E]">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FF6B35]">{totalViews}</div>
              <div className="text-[13px] text-[#636369] flex items-center gap-1 justify-center">
                <Eye size={12} />
                Profile views
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 mb-6">
          <h3 className="text-[#F5F5F7] font-semibold mb-4">Social Links</h3>

          {/* LinkedIn */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Linkedin size={16} className="text-[#0A66C2]" />
              <span className="text-[#A0A0A8] text-[13px]">LinkedIn</span>
            </div>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636369] text-[13px]">
                  linkedin.com/in/
                </span>
                <input
                  type="text"
                  value={editData.linkedin_username}
                  onChange={(e) => setEditData({ ...editData, linkedin_username: e.target.value })}
                  className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg pl-[110px] pr-4 py-2 text-[#F5F5F7] text-[13px]"
                />
              </div>
            ) : (
              <a
                href={`https://linkedin.com/in/${profile.linkedin_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0A66C2] hover:underline text-[15px]"
              >
                linkedin.com/in/{profile.linkedin_username}
              </a>
            )}
          </div>

          {/* Twitter */}
          {(isEditing || profile.twitter_username) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Twitter size={16} className="text-[#1DA1F2]" />
                <span className="text-[#A0A0A8] text-[13px]">Twitter/X</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.twitter_username || ''}
                  onChange={(e) => setEditData({ ...editData, twitter_username: e.target.value })}
                  className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-2 text-[#F5F5F7] text-[13px]"
                  placeholder="@username"
                />
              ) : (
                <a
                  href={`https://twitter.com/${profile.twitter_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1DA1F2] hover:underline text-[15px]"
                >
                  @{profile.twitter_username}
                </a>
              )}
            </div>
          )}

          {/* Instagram */}
          {(isEditing || profile.instagram_username) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Instagram size={16} className="text-[#E4405F]" />
                <span className="text-[#A0A0A8] text-[13px]">Instagram</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.instagram_username || ''}
                  onChange={(e) => setEditData({ ...editData, instagram_username: e.target.value })}
                  className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-2 text-[#F5F5F7] text-[13px]"
                  placeholder="@username"
                />
              ) : (
                <a
                  href={`https://instagram.com/${profile.instagram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E4405F] hover:underline text-[15px]"
                >
                  @{profile.instagram_username}
                </a>
              )}
            </div>
          )}

          {/* GitHub */}
          {(isEditing || profile.github_username) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Github size={16} className="text-[#F5F5F7]" />
                <span className="text-[#A0A0A8] text-[13px]">GitHub</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.github_username || ''}
                  onChange={(e) => setEditData({ ...editData, github_username: e.target.value })}
                  className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-2 text-[#F5F5F7] text-[13px]"
                  placeholder="@username"
                />
              ) : (
                <a
                  href={`https://github.com/${profile.github_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F5F5F7] hover:underline text-[15px]"
                >
                  @{profile.github_username}
                </a>
              )}
            </div>
          )}

          {/* Portfolio */}
          {(isEditing || profile.portfolio_url) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className="text-[#5AC8FA]" />
                <span className="text-[#A0A0A8] text-[13px]">Website</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.portfolio_url || ''}
                  onChange={(e) => setEditData({ ...editData, portfolio_url: e.target.value })}
                  className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-4 py-2 text-[#F5F5F7] text-[13px]"
                  placeholder="https://yoursite.com"
                />
              ) : (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5AC8FA] hover:underline text-[15px] break-all"
                >
                  {profile.portfolio_url}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-transparent border border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30]/10 font-semibold rounded-lg px-6 py-3 transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </main>
  );
}
