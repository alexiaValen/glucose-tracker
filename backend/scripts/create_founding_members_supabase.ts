import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with SERVICE ROLE key (not anon key!)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Critical: use service role key
);

const TEMP_PASSWORD = 'GraceFlow2025!';

const foundingMembers = [
  { email: 'jenlcox@icloud.com', name: 'Jen Cox' },
  { email: 'jeremy.sara@yahoo.com', name: 'Sara Hadaway' },
  { email: 'nnttmndz@gmail.com', name: 'Annette Mendez' },
  { email: 'rachellegray360@gmail.com', name: 'Rachelle Gray' },
];

async function createFoundingMembers() {
  try {
    console.log('Creating founding members in Supabase...\n');

    // Get HFR group ID first
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('name', 'HFR')
      .single();

    if (groupError || !groupData) {
      throw new Error('HFR group not found. Create it first.');
    }

    const groupId = groupData.id;
    console.log(`✓ Found HFR group: ${groupId}\n`);

    // Get coach ID
    const { data: coachData } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'coach')
      .single();

    const coachId = coachData?.id;

    for (const member of foundingMembers) {
      console.log(`Processing ${member.name}...`);

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: member.email,
        password: TEMP_PASSWORD,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: member.name,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists in auth, fetching...`);
          const { data: existingUser } = await supabase.auth.admin.listUsers();
          const user = existingUser?.users.find(u => u.email === member.email);
          
          if (!user) {
            console.log(`  ❌ Could not find existing user`);
            continue;
          }

          // 2. Ensure user record exists in public.users
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: member.email,
              name: member.name,
              role: 'user',
            }, { onConflict: 'id' });

          if (upsertError) {
            console.log(`  ❌ Error upserting user record: ${upsertError.message}`);
            continue;
          }

          // 3. Add to group
          const { error: memberError } = await supabase
            .from('group_members')
            .upsert({
              group_id: groupId,
              user_id: user.id,
              joined_at: new Date().toISOString(),
            }, { onConflict: 'group_id,user_id' });

          if (memberError) {
            console.log(`  ❌ Error adding to group: ${memberError.message}`);
          } else {
            console.log(`  ✓ Added to HFR group`);
          }

          // 4. Create conversation if coach exists
          if (coachId) {
            const { error: convError } = await supabase
              .from('conversations')
              .upsert({
                coach_id: coachId,
                client_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'coach_id,client_id' });

            if (!convError) {
              console.log(`  ✓ Created conversation with coach`);
            }
          }

          console.log(`  ✓ Updated ${member.name}\n`);
          continue;
        }

        console.log(`  ❌ Error creating auth user: ${authError.message}\n`);
        continue;
      }

      const userId = authData.user.id;
      console.log(`  ✓ Created auth user (${userId})`);

      // 2. Create user record in public.users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: member.email,
          name: member.name,
          role: 'user',
        });

      if (userError) {
        console.log(`  ❌ Error creating user record: ${userError.message}`);
        continue;
      }
      console.log(`  ✓ Created user record`);

      // 3. Add to HFR group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.log(`  ❌ Error adding to group: ${memberError.message}`);
      } else {
        console.log(`  ✓ Added to HFR group`);
      }

      // 4. Create conversation with coach
      if (coachId) {
        const { error: convError } = await supabase
          .from('conversations')
          .insert({
            coach_id: coachId,
            client_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (!convError) {
          console.log(`  ✓ Created conversation with coach`);
        }
      }

      console.log(`  ✅ Completed ${member.name}\n`);
    }

    console.log('\n✅ All founding members processed!');
    console.log(`\nTemporary password: ${TEMP_PASSWORD}`);
    console.log('⚠️  Users should reset their password immediately.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run it
createFoundingMembers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));