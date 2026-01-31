// backend/scripts/create-hfr-group.ts
// Script to create Michelle's "Holy Flawless Restored" group

import { supabase } from '../src/config/database';

async function createHFRGroup() {
  try {
    console.log('🌿 Creating Holy Flawless Restored group...');

    // First, get Michelle's coach account ID
    const COACH_EMAIL = 'michellerediger@gmail.com';

    const { data: coach, error: coachError } = await supabase
      .from('users')
      .select('id')
      .eq('email', COACH_EMAIL)
      .eq('role', 'coach')
      .single();

    if (coachError || !coach) {
      console.error('❌ Coach not found. Make sure Michelle has a coach account.');
      console.error('Create one at: POST /api/v1/auth/register with role: "coach"');
      return;
    }

    console.log('✅ Found coach:', coach.id);

    // Generate unique access code
    let accessCode = 'HFR-FEB2025'; // Custom code for founding members
    
    // Check if code exists
    const { data: existing } = await supabase
      .from('coaching_groups')
      .select('id')
      .eq('access_code', accessCode)
      .single();

    if (existing) {
      console.log('⚠️  Group with this code already exists!');
      accessCode = `HFR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      console.log('Using new code:', accessCode);
    }

    // Calculate dates
    const startDate = new Date('2025-02-06');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (12 * 7)); // 12 weeks

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('coaching_groups')
      .insert({
        name: 'Holy Flawless Restored - February 2025',
        description: `12-week cycle-synced metabolic reset program for women. 
        
Blends biblical wisdom, scientific research, and practical coaching to help women restore energy, balance hormones, and reconnect with God-designed rhythms.

Weekly Zoom sessions: Thursdays 7-8:30 PM CT

Program includes:
• Weeks 1-3: Foundations (hormones, cycle tracking, fasting intro)
• Weeks 4-6: Nutrition Reset (anti-inflammatory eating, blood sugar balance)
• Weeks 7-9: Movement Reset (strength training, cycle-synced workouts)
• Weeks 10-12: Integration & Transformation`,
        coach_id: coach.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        duration_weeks: 12,
        access_code: accessCode,
        max_members: 20,
        current_members: 0,
        status: 'active',
        pricing: {
          founding: 450,
          paymentPlan: 165,
          fullPrice: 1500
        },
        meeting_schedule: {
          day: 'Thursday',
          time: '19:00',
          timezone: 'America/Chicago',
          duration: 90,
          platform: 'Zoom'
        }
      })
      .select()
      .single();

    if (groupError) {
      console.error('❌ Error creating group:', groupError);
      return;
    }

    console.log('\n✅ Group created successfully!\n');
    console.log('📋 Group Details:');
    console.log('   ID:', group.id);
    console.log('   Name:', group.name);
    console.log('   Start Date:', startDate.toLocaleDateString());
    console.log('   Duration:', group.duration_weeks, 'weeks');
    console.log('   Max Members:', group.max_members);
    console.log('\n🔑 ACCESS CODE:', accessCode);
    console.log('\n💰 Pricing:');
    console.log('   Founding (pay-in-full):', `$${group.pricing.founding}`);
    console.log('   Payment Plan:', `$${group.pricing.paymentPlan} x 3 months`);
    console.log('   Future Price:', `$${group.pricing.fullPrice}`);
    console.log('\n📅 Meeting Schedule:');
    console.log('   Day:', group.meeting_schedule.day);
    console.log('   Time:', group.meeting_schedule.time, group.meeting_schedule.timezone);
    console.log('\n👉 Share this code with founding members:', accessCode);
    console.log('\n📱 They can join in the GraceFlow app under "Groups" → "Join with Code"');

    // Create initial sessions (optional)
    console.log('\n📚 Creating initial session templates...');
    
    const sessions = [
      { week: 1, title: 'Foundations: Understanding Your Hormones', phase: 'Foundations' },
      { week: 2, title: 'Cycle Tracking & Body Literacy', phase: 'Foundations' },
      { week: 3, title: 'Introduction to Fasting', phase: 'Foundations' },
      { week: 4, title: 'Anti-Inflammatory Eating', phase: 'Nutrition Reset' },
      { week: 5, title: 'Blood Sugar Balance', phase: 'Nutrition Reset' },
      { week: 6, title: 'Phase-Specific Nutrition', phase: 'Nutrition Reset' },
      { week: 7, title: 'Strength Training for Midlife', phase: 'Movement Reset' },
      { week: 8, title: 'Cycle-Synced Workouts', phase: 'Movement Reset' },
      { week: 9, title: 'Stress-Reducing Movement', phase: 'Movement Reset' },
      { week: 10, title: 'Identity-Based Habits', phase: 'Integration' },
      { week: 11, title: 'Long-Term Metabolic Strategy', phase: 'Integration' },
      { week: 12, title: 'Celebration & Next Steps', phase: 'Integration' },
    ];

    for (const session of sessions) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(sessionDate.getDate() + ((session.week - 1) * 7));
      sessionDate.setHours(19, 0, 0, 0); // 7 PM

      await supabase
        .from('group_sessions')
        .insert({
          group_id: group.id,
          week_number: session.week,
          title: session.title,
          description: `Week ${session.week} of Holy Flawless Restored - ${session.phase}`,
          session_date: sessionDate.toISOString(),
          status: 'upcoming',
          materials: []
        });
    }

    console.log('✅ Created 12 session templates');
    console.log('\n🎉 Setup complete! Michelle can now:');
    console.log('   1. Share the access code with founding members');
    console.log('   2. Add Zoom links to each session');
    console.log('   3. Upload materials (PDFs, workbooks)');
    console.log('   4. Post announcements in group chat');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createHFRGroup()
  .then(() => {
    console.log('\n✅ Script complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });