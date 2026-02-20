"use client";

import { createClient } from '@/lib/supabase/client';
import { isSuperAdmin } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Users, TrendingUp, Loader2, X, Check } from 'lucide-react';

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
  organizer_count?: number;
  room_count?: number;
  member_count?: number;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
}

export default function SuperAdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAccessAndLoadData();
  }, []);

  const checkAccessAndLoadData = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !isSuperAdmin(profile.role)) {
        // Not a super admin, redirect to home
        router.push('/home');
        return;
      }

      setUserRole(profile.role);
      await loadOrganizations();
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/home');
    }
  };

  const loadOrganizations = async () => {
    try {
      // Load organizations with stats
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          *,
          event_organizers(count),
          rooms(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data
      const formattedOrgs = orgs?.map(org => ({
        ...org,
        organizer_count: org.event_organizers?.[0]?.count || 0,
        room_count: org.rooms?.[0]?.count || 0,
      })) || [];

      setOrganizations(formattedOrgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] pb-20">
      {/* Header */}
      <div className="bg-[#1C1C20] border-b border-[#2A2A2E] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F7]">Super Admin</h1>
              <p className="text-[#A0A0A8] text-sm mt-1">Manage organizations and events</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85A28] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Onboard Event
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1C1C20] rounded-xl p-6 border border-[#2A2A2E]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-[#A0A0A8] text-sm">Total Events</p>
                <p className="text-[#F5F5F7] text-2xl font-bold">{organizations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1C1C20] rounded-xl p-6 border border-[#2A2A2E]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-[#A0A0A8] text-sm">Event Organizers</p>
                <p className="text-[#F5F5F7] text-2xl font-bold">
                  {organizations.reduce((sum, org) => sum + (org.organizer_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1C1C20] rounded-xl p-6 border border-[#2A2A2E]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-[#A0A0A8] text-sm">Total Rooms</p>
                <p className="text-[#F5F5F7] text-2xl font-bold">
                  {organizations.reduce((sum, org) => sum + (org.room_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F7] mb-4">Organizations</h2>

          {organizations.length === 0 ? (
            <div className="bg-[#1C1C20] rounded-xl p-12 text-center border border-[#2A2A2E]">
              <Building2 className="w-12 h-12 text-[#636369] mx-auto mb-4" />
              <p className="text-[#A0A0A8] mb-4">No organizations onboarded yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-[#FF6B35] hover:text-[#E85A28] font-medium"
              >
                Onboard your first event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <OrganizationCard key={org.id} org={org} onUpdate={loadOrganizations} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadOrganizations();
          }}
        />
      )}
    </main>
  );
}

// Organization Card Component
function OrganizationCard({ org, onUpdate }: { org: Organization; onUpdate: () => void }) {
  const router = useRouter();

  return (
    <>
      <div
        onClick={() => router.push(`/admin/org/${org.id}`)}
        className="bg-[#1C1C20] rounded-xl p-6 border border-[#2A2A2E] hover:border-[#FF6B35]/30 transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#FF6B35]" />
              </div>
            )}
            <div>
              <h3 className="text-[#F5F5F7] font-semibold group-hover:text-[#FF6B35] transition-colors">
                {org.name}
              </h3>
              <p className="text-[#636369] text-sm">@{org.slug}</p>
            </div>
          </div>
          {org.is_active && (
            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-md">
              Active
            </span>
          )}
        </div>

        {org.description && (
          <p className="text-[#A0A0A8] text-sm mb-4 line-clamp-2">{org.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-[#A0A0A8]">
            <Users className="w-4 h-4" />
            <span>{org.organizer_count} organizers</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#A0A0A8]">
            <Building2 className="w-4 h-4" />
            <span>{org.room_count} rooms</span>
          </div>
        </div>
      </div>
    </>
  );
}

// Create Organization Modal
function CreateOrganizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    organizer_email: '', // NEW: Email of person who will manage this event
  });
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create organization
      const { data: orgData, error: insertError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          description: formData.description,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If organizer email provided, assign them
      if (formData.organizer_email.trim()) {
        // Find user by matching their Google auth email in auth.users
        // We'll use a database function for this
        const { data: authUsers } = await supabase
          .from('profiles')
          .select('id')
          .limit(1000); // Get all profiles

        // Find matching user (we need to check auth.users table via RPC or service function)
        // For now, let's assume the email is stored in profile
        // Better approach: create an edge function or use service role

        // Simpler approach: Store invitation and process when user signs up
        // For MVP: Just show message that user needs to sign up first

        // TODO: Create an "organization_invites" table for pending invites

        setError(`Organization created! To add organizers, they must sign up first, then you can assign them from the organization page.`);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1C1C20] rounded-2xl max-w-lg w-full border border-[#2A2A2E]">
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2E]">
          <h2 className="text-xl font-bold text-[#F5F5F7]">Onboard New Event</h2>
          <button onClick={onClose} className="text-[#A0A0A8] hover:text-[#F5F5F7]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[#A0A0A8] text-sm mb-2">Event Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="TechFest 2024"
              className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-[#A0A0A8] text-sm mb-2">Slug (URL-friendly) *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="techfest-2024"
              className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
            />
            <p className="text-[#636369] text-xs mt-1">Will be: huddle.app/{formData.slug || 'slug'}</p>
          </div>

          <div>
            <label className="block text-[#A0A0A8] text-sm mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the event"
              rows={3}
              className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35] resize-none"
            />
          </div>

          <div>
            <label className="block text-[#A0A0A8] text-sm mb-2">Contact Email *</label>
            <input
              type="email"
              required
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="contact@techfest.org"
              className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-[#A0A0A8] text-sm mb-2">Contact Phone</label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-[#2A2A2E] text-[#A0A0A8] hover:text-[#F5F5F7] hover:border-[#636369] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#E85A28] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Manage Organization Modal
function ManageOrganizationModal({ org, onClose, onSuccess }: { org: Organization; onClose: () => void; onSuccess: () => void }) {
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrganizerEmail, setNewOrganizerEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      const { data, error } = await supabase
        .from('event_organizers')
        .select(`
          *,
          profiles!event_organizers_user_id_fkey (id, full_name, avatar_url, role)
        `)
        .eq('organization_id', org.id);

      if (error) {
        console.error('Error loading organizers:', error);
        throw error;
      }

      console.log('Loaded organizers:', data);
      setOrganizers(data || []);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading organizers:', err);
      setError(`Failed to load organizers: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleAddOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find user by email
      const { data: authData, error: rpcError } = await supabase.rpc('get_user_id_by_email', {
        email_input: newOrganizerEmail.trim()
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        setError(`Error looking up user: ${rpcError.message}`);
        setIsAdding(false);
        return;
      }

      if (!authData) {
        setError(`User with email "${newOrganizerEmail}" not found. They need to sign in first at ${window.location.origin} (using Google OAuth), then you can add them here.`);
        setIsAdding(false);
        return;
      }

      // Check if already an organizer
      const { data: existing } = await supabase
        .from('event_organizers')
        .select('*')
        .eq('organization_id', org.id)
        .eq('user_id', authData)
        .single();

      if (existing) {
        setError('This user is already an organizer for this organization.');
        setIsAdding(false);
        return;
      }

      // Update user role to event_organizer using privileged function
      const { error: roleError } = await supabase.rpc('update_user_role', {
        target_user_id: authData,
        new_role: 'event_organizer'
      });

      if (roleError) {
        console.error('Role update error:', roleError);
        throw new Error(`Failed to update user role: ${roleError.message}`);
      }

      // Add to organization
      const { error: insertError } = await supabase
        .from('event_organizers')
        .insert({
          organization_id: org.id,
          user_id: authData,
          role: 'organizer',
          added_by: user.id,
        });

      if (insertError) throw insertError;

      // Success!
      setNewOrganizerEmail('');
      await loadOrganizers();
      onSuccess(); // Refresh parent component
      setIsAdding(false);

      // Show success message
      alert(`✅ Organizer added successfully!\n\nIMPORTANT: The user needs to SIGN OUT and SIGN BACK IN for their new role to take effect.`);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error adding organizer:', err);
      setError(err.message || 'Failed to add organizer');
      setIsAdding(false);
    }
  };

  const handleRemoveOrganizer = async (organizerId: string) => {
    if (!confirm('Remove this organizer?')) return;

    try {
      await supabase
        .from('event_organizers')
        .delete()
        .eq('organization_id', org.id)
        .eq('user_id', organizerId);

      await loadOrganizers();
    } catch (err) {
      console.error('Error removing organizer:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1C1C20] rounded-2xl max-w-2xl w-full border border-[#2A2A2E] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2E]">
          <div>
            <h2 className="text-xl font-bold text-[#F5F5F7]">Manage {org.name}</h2>
            <p className="text-[#A0A0A8] text-sm mt-1">Add or remove event organizers</p>
          </div>
          <button onClick={onClose} className="text-[#A0A0A8] hover:text-[#F5F5F7]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add Organizer Form */}
          <div>
            <h3 className="text-sm font-semibold text-[#F5F5F7] mb-3">Add Event Organizer</h3>
            <form onSubmit={handleAddOrganizer} className="flex gap-2">
              <input
                type="email"
                required
                value={newOrganizerEmail}
                onChange={(e) => setNewOrganizerEmail(e.target.value)}
                placeholder="organizer@example.com"
                className="flex-1 bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-2 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-2 bg-[#FF6B35] hover:bg-[#E85A28] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </form>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Current Organizers */}
          <div>
            <h3 className="text-sm font-semibold text-[#F5F5F7] mb-3">
              Current Organizers ({organizers.length})
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
              </div>
            ) : organizers.length === 0 ? (
              <div className="bg-[#0A0A0B] rounded-lg p-6 text-center border border-[#2A2A2E]">
                <Users className="w-8 h-8 text-[#636369] mx-auto mb-2" />
                <p className="text-[#A0A0A8] text-sm">No organizers assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {organizers.map((organizer) => (
                  <div
                    key={organizer.user_id}
                    className="bg-[#0A0A0B] rounded-lg p-4 border border-[#2A2A2E] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {organizer.profiles?.avatar_url ? (
                        <img
                          src={organizer.profiles.avatar_url}
                          alt={organizer.profiles.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                          <span className="text-[#FF6B35] font-semibold">
                            {organizer.profiles?.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-[#F5F5F7] font-medium">
                          {organizer.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-[#636369] text-sm capitalize">{organizer.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveOrganizer(organizer.user_id)}
                      className="text-[#636369] hover:text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-[#2A2A2E]">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg bg-[#0A0A0B] border border-[#2A2A2E] text-[#A0A0A8] hover:text-[#F5F5F7] hover:border-[#636369] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
