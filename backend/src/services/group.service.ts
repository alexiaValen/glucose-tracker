// backend/src/services/group.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CoachingGroup,
  GroupMembership,
  CreateGroupRequest,
  JoinGroupRequest,
} from '../types/group';

export class GroupService {
  constructor(private supabase: SupabaseClient) {}

  // Generate unique access code
  generateAccessCode(): string {
    const prefix = 'HFR';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${code}`;
  }

  // Create new coaching group
  async createGroup(coachId: string, data: CreateGroupRequest): Promise<CoachingGroup> {
    // Generate unique access code (best if DB also has UNIQUE constraint)
    let accessCode = this.generateAccessCode();
    for (let attempts = 0; attempts < 15; attempts++) {
      const { data: existing, error } = await this.supabase
        .from('coaching_groups')
        .select('id')
        .eq('access_code', accessCode)
        .maybeSingle();

      if (error) throw error;
      if (!existing) break; // unique
      accessCode = this.generateAccessCode();
    }

    // Calculate end date
    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + data.durationWeeks * 7);

    const { data: created, error } = await this.supabase
      .from('coaching_groups')
      .insert({
        name: data.name,
        description: data.description,
        coach_id: coachId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        duration_weeks: data.durationWeeks,
        access_code: accessCode,
        max_members: data.maxMembers,
        pricing: data.pricing, // assumes json/jsonb column
        meeting_schedule: data.meetingSchedule, // assumes json/jsonb column
        status: 'active',
      })
      .select('*')
      .single();

    if (error) throw error;
    return created as CoachingGroup;
  }

  // Verify access code
  async verifyAccessCode(code: string): Promise<{ valid: boolean; group?: CoachingGroup }> {
    const normalized = code.toUpperCase().trim();

    // Get group
    const { data: group, error } = await this.supabase
      .from('coaching_groups')
      .select('*')
      .eq('access_code', normalized)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    if (!group) return { valid: false };

    // Count active members
    const { count, error: countErr } = await this.supabase
      .from('group_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('status', 'active');

    if (countErr) throw countErr;

    if (typeof count === 'number' && count >= group.max_members) {
      return { valid: false };
    }

    return { valid: true, group: group as CoachingGroup };
  }

  // Join group with access code
  async joinGroup(userId: string, data: JoinGroupRequest): Promise<GroupMembership> {
    // Verify code + capacity
    const verification = await this.verifyAccessCode(data.accessCode);
    if (!verification.valid || !verification.group) {
      throw new Error('Invalid or expired access code');
    }

    const group = verification.group;

    // Check if already in group
    const { data: existing, error: existingErr } = await this.supabase
      .from('group_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('group_id', group.id)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) throw new Error('Already a member of this group');

    // Determine payment amount
    const paymentAmount =
      data.paymentType === 'founding'
        ? (group as any).pricing?.founding
        : (group as any).pricing?.paymentPlan;

    const { data: membership, error } = await this.supabase
      .from('group_memberships')
      .insert({
        group_id: group.id,
        user_id: userId,
        membership_type: data.paymentType ?? 'founding',
        payment_status: 'pending',
        payment_amount: paymentAmount ?? null,
        status: 'active', // adjust if you want pending until paid
        joined_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return membership as GroupMembership;
  }

  // Get user's groups
  async getUserGroups(userId: string): Promise<CoachingGroup[]> {
    // Pull memberships + group info
    const { data, error } = await this.supabase
      .from('group_memberships')
      .select(
        `
        status,
        joined_at,
        coaching_groups (*)
      `
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (error) throw error;

    // flatten to CoachingGroup[]
    const groups = (data ?? [])
      .map((row: any) => row.coaching_groups)
      .filter(Boolean);

    return groups as CoachingGroup[];
  }

  // Get group details (member or coach)
  async getGroup(groupId: string, userId: string): Promise<CoachingGroup | null> {
    // Check coach
    const { data: asCoach, error: coachErr } = await this.supabase
      .from('coaching_groups')
      .select('id')
      .eq('id', groupId)
      .eq('coach_id', userId)
      .maybeSingle();

    if (coachErr) throw coachErr;

    // Check membership if not coach
    if (!asCoach) {
      const { data: member, error: memErr } = await this.supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (memErr) throw memErr;
      if (!member) throw new Error('Not authorized to view this group');
    }

    const { data: group, error } = await this.supabase
      .from('coaching_groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();

    if (error) throw error;
    return (group ?? null) as CoachingGroup | null;
  }

  // Get group members
  async getGroupMembers(groupId: string): Promise<any[]> {
    // Join memberships -> users using nested select
    const { data, error } = await this.supabase
      .from('group_memberships')
      .select(
        `
        joined_at,
        membership_type,
        completed_weeks,
        users (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `
      )
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    // Flatten for your expected shape
    return (data ?? []).map((row: any) => ({
      ...(row.users ?? {}),
      joined_at: row.joined_at,
      membership_type: row.membership_type,
      completed_weeks: row.completed_weeks,
    }));
  }

  // Get groups coached by user
  async getCoachGroups(coachId: string): Promise<CoachingGroup[]> {
    const { data, error } = await this.supabase
      .from('coaching_groups')
      .select('*')
      .eq('coach_id', coachId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as CoachingGroup[];
  }

  // Generate bulk access codes
  async generateBulkCodes(groupId: string, quantity: number): Promise<string[]> {
    const codes: string[] = [];
    const rowsToInsert: { code: string; group_id: string }[] = [];

    // NOTE: Best if access_codes.code has UNIQUE constraint in DB
    for (let i = 0; i < quantity; i++) {
      let code = this.generateAccessCode();
      for (let attempts = 0; attempts < 15; attempts++) {
        const { data: exists, error } = await this.supabase
          .from('access_codes')
          .select('id')
          .eq('code', code)
          .maybeSingle();

        if (error) throw error;
        if (!exists) break;
        code = this.generateAccessCode();
      }

      codes.push(code);
      rowsToInsert.push({ code, group_id: groupId });
    }

    const { error } = await this.supabase.from('access_codes').insert(rowsToInsert);
    if (error) throw error;

    return codes;
  }
}