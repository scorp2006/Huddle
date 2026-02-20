"use client";

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2, Check, Info } from 'lucide-react';

interface Classification {
  id: string;
  name: string;
  requires_approval: boolean;
  display_order: number;
}

function CreateRoomForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    starts_at: '',
    duration_hours: 8,
  });
  const [classifications, setClassifications] = useState<Omit<Classification, 'id'>[]>([
    { name: 'Attendee', requires_approval: false, display_order: 1 },
  ]);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  useEffect(() => {
    if (!orgId) {
      router.push('/organizer');
    }
  }, [orgId]);

  const addClassification = () => {
    setClassifications([
      ...classifications,
      {
        name: '',
        requires_approval: true,
        display_order: classifications.length + 1,
      },
    ]);
  };

  const removeClassification = (index: number) => {
    if (classifications.length === 1) return; // Keep at least one
    setClassifications(classifications.filter((_, i) => i !== index));
  };

  const updateClassification = (index: number, field: string, value: any) => {
    const updated = [...classifications];
    updated[index] = { ...updated[index], [field]: value };
    setClassifications(updated);
  };

  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate classifications
      const emptyNames = classifications.filter(c => !c.name.trim());
      if (emptyNames.length > 0) {
        throw new Error('All classification names must be filled');
      }

      // Calculate expiration (starts_at + duration_hours * 2)
      const startsAt = new Date(formData.starts_at);
      const expiresAt = new Date(startsAt.getTime() + (formData.duration_hours * 2 * 60 * 60 * 1000));

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          organization_id: orgId,
          name: formData.name,
          description: formData.description,
          code: generateRoomCode(),
          created_by: user.id,
          starts_at: startsAt.toISOString(),
          duration_hours: formData.duration_hours,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Create classifications (database trigger already created "Attendee", so update or add more)
      const classificationsToInsert = classifications.map((c, index) => ({
        room_id: room.id,
        name: c.name,
        requires_approval: c.requires_approval,
        display_order: index + 1,
      }));

      // Remove the default "Attendee" if user customized it
      await supabase
        .from('room_classifications')
        .delete()
        .eq('room_id', room.id);

      // Insert custom classifications
      const { error: classError } = await supabase
        .from('room_classifications')
        .insert(classificationsToInsert);

      if (classError) throw classError;

      // Redirect to room share page
      router.push(`/room/${room.id}/share`);
    } catch (err: any) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] pb-20">
      {/* Header */}
      <div className="bg-[#1C1C20] border-b border-[#2A2A2E] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#A0A0A8] hover:text-[#F5F5F7] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-[#F5F5F7]">Create Event Room</h1>
          <p className="text-[#A0A0A8] text-sm mt-1">Set up your event room with custom classifications</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Basic Info */}
        <div className="bg-[#1C1C20] rounded-xl p-6 border border-[#2A2A2E]">
          <h2 className="text-lg font-semibold text-[#F5F5F7] mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[#A0A0A8] text-sm mb-2">Room Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Opening Ceremony, Workshop Track A, etc."
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <label className="block text-[#A0A0A8] text-sm mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this room/session"
                rows={3}
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A0A0A8] text-sm mb-2">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A8] text-sm mb-2">Duration (hours) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="72"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                  className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded-lg px-4 py-3 text-[#F5F5F7] focus:outline-none focus:border-[#FF6B35]"
                />
                <p className="text-[#636369] text-xs mt-1">Room will be available for 2x this duration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classifications */}
        <div className="bg-[#1C1C20] rounded-xl p-6 border border-[#2A2A2E]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F5F7]">Participant Classifications</h2>
              <p className="text-[#636369] text-sm mt-1">Define roles for your event (e.g., Attendee, Speaker, Judge)</p>
            </div>
            <button
              type="button"
              onClick={addClassification}
              className="flex items-center gap-2 text-[#FF6B35] hover:text-[#E85A28] font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          </div>

          <div className="space-y-3">
            {classifications.map((classification, index) => (
              <div key={index} className="bg-[#0A0A0B] rounded-lg p-4 border border-[#2A2A2E]">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={classification.name}
                      onChange={(e) => updateClassification(index, 'name', e.target.value)}
                      placeholder="Role name (e.g., Attendee, Speaker)"
                      className="w-full bg-[#1C1C20] border border-[#2A2A2E] rounded-lg px-3 py-2 text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6B35]"
                    />

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={classification.requires_approval}
                        onChange={(e) => updateClassification(index, 'requires_approval', e.target.checked)}
                        className="w-4 h-4 rounded bg-[#1C1C20] border-[#2A2A2E] text-[#FF6B35] focus:ring-[#FF6B35] focus:ring-offset-0"
                      />
                      <span className="text-[#A0A0A8]">Requires organizer approval</span>
                    </label>
                  </div>

                  {classifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeClassification(index)}
                      className="text-[#636369] hover:text-red-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-lg p-3 flex gap-3">
            <Info className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#A0A0A8]">
              <p className="font-medium text-[#F5F5F7] mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Users select their role when joining</li>
                <li>Roles without approval join instantly</li>
                <li>Roles requiring approval need your confirmation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-lg border border-[#2A2A2E] text-[#A0A0A8] hover:text-[#F5F5F7] hover:border-[#636369] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#E85A28] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Create Room
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </main>
    }>
      <CreateRoomForm />
    </Suspense>
  );
}
