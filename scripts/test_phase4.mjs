import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[match[1]] = val.trim();
  }
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 4 AUTOMATED TEST SUITE (Node Native)');
  console.log('====================================================\n');

  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const clientB = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const emailA = `studio_lead_alpha@apniestatetest.com`;
  const emailB = `studio_lead_beta@apniestatetest.com`;
  const password = 'TestSecurePassword123!';

  console.log('--- 1. AUTHENTICATING USER A & USER B ---');
  
  // 1. Auth User A
  let userAId;
  const { data: signInA, error: signinErrA } = await clientA.auth.signInWithPassword({
    email: emailA,
    password: password
  });

  if (signInA?.user) {
    userAId = signInA.user.id;
    console.log('✅ User A logged in:', emailA, 'ID:', userAId);
  } else {
    const { data: signUpA, error: errA } = await clientA.auth.signUp({
      email: emailA,
      password: password,
      options: {
        data: {
          full_name: 'Aarav Studio A',
          studio_name: 'Studio Alpha Interiors',
          phone: '+91 98200 11111',
          plan: 'studio'
        }
      }
    });
    if (errA || !signUpA.user) {
      throw new Error(`Failed to auth User A: ${errA?.message || signinErrA?.message}`);
    }
    userAId = signUpA.user.id;
    console.log('✅ User A created:', emailA, 'ID:', userAId);
  }

  // Bootstrap Org A
  await clientA.rpc('create_trial_organization', {
    org_name: 'Studio Alpha Interiors',
    full_name: 'Aarav Studio A',
    phone: '+91 98200 11111',
    plan_name: 'studio'
  });

  const { data: profileA } = await clientA.from('profiles').select('*').eq('id', userAId).single();
  const organizationAId = profileA?.organization_id;
  console.log('✅ Studio A Organization ID:', organizationAId);

  // 2. Auth User B
  let userBId;
  const { data: signInB, error: signinErrB } = await clientB.auth.signInWithPassword({
    email: emailB,
    password: password
  });

  if (signInB?.user) {
    userBId = signInB.user.id;
    console.log('✅ User B logged in:', emailB, 'ID:', userBId);
  } else {
    const { data: signUpB, error: errB } = await clientB.auth.signUp({
      email: emailB,
      password: password,
      options: {
        data: {
          full_name: 'Bhavna Studio B',
          studio_name: 'Studio Beta Designs',
          phone: '+91 98200 22222',
          plan: 'studio'
        }
      }
    });
    if (errB || !signUpB.user) {
      throw new Error(`Failed to auth User B: ${errB?.message || signinErrB?.message}`);
    }
    userBId = signUpB.user.id;
    console.log('✅ User B created:', emailB, 'ID:', userBId);
  }

  // Bootstrap Org B
  await clientB.rpc('create_trial_organization', {
    org_name: 'Studio Beta Designs',
    full_name: 'Bhavna Studio B',
    phone: '+91 98200 22222',
    plan_name: 'studio'
  });

  const { data: profileB } = await clientB.from('profiles').select('*').eq('id', userBId).single();
  const organizationBId = profileB?.organization_id;
  console.log('✅ Studio B Organization ID:', organizationBId);

  console.log('\n--- 2. SNEHIL PANDEY CRUD & PERSISTENCE TEST (USER A) ---');
  
  // Create Client: Snehil Pandey
  const { data: clientRecordA, error: clientCreateErr } = await clientA
    .from('clients')
    .insert({
      organization_id: organizationAId,
      name: 'Snehil Pandey',
      phone: '+91 98765 43210',
      email: 'snehil.pandey@gmail.com',
      address: 'Bandra West, Mumbai',
      notes: 'Prefers warm minimalist palette and Italian marble.'
    })
    .select()
    .single();

  if (clientCreateErr) throw new Error(`Failed to create client: ${clientCreateErr.message}`);
  console.log('✅ Client Created:', clientRecordA.name, 'ID:', clientRecordA.id);

  // Create Project: Snehil Residence
  const { data: projectRecordA, error: projCreateErr } = await clientA
    .from('projects')
    .insert({
      organization_id: organizationAId,
      client_id: clientRecordA.id,
      name: 'Snehil Residence',
      location: 'Bandra West, Mumbai',
      project_type: 'residential',
      budget: 200000,
      contract_value: 250000,
      start_date: '2026-09-01',
      deadline: '2026-11-15',
      progress: 0,
      status: 'on_track',
      description: '3BHK turnkey interior design and execution.'
    })
    .select()
    .single();

  if (projCreateErr) throw new Error(`Failed to create project: ${projCreateErr.message}`);
  console.log('✅ Project Created:', projectRecordA.name, 'Budget: ₹' + projectRecordA.budget, 'ID:', projectRecordA.id);

  // Create Rooms
  const roomsToInsert = [
    { name: 'Living Room', budget: 70000, room_type: 'Living Room', progress: 0, notes: 'Cove lighting & TV console' },
    { name: 'Kitchen', budget: 60000, room_type: 'Kitchen', progress: 0, notes: 'Modular acrylic cabinets' },
    { name: 'Master Bedroom', budget: 70000, room_type: 'Master Bedroom', progress: 0, notes: 'Veneer bed back panel' }
  ];

  const createdRoomsA = [];
  for (const r of roomsToInsert) {
    const { data: roomRec, error: roomErr } = await clientA
      .from('rooms')
      .insert({
        organization_id: organizationAId,
        project_id: projectRecordA.id,
        name: r.name,
        room_type: r.room_type,
        budget: r.budget,
        progress: r.progress,
        notes: r.notes
      })
      .select()
      .single();

    if (roomErr) throw new Error(`Failed to create room ${r.name}: ${roomErr.message}`);
    createdRoomsA.push(roomRec);
    console.log(`✅ Room Added: ${roomRec.name} (Budget: ₹${roomRec.budget}) ID: ${roomRec.id}`);
  }

  console.log('\n--- 3. RELATIONSHIP & QUERY TEST ---');
  // Query project with client and rooms
  const { data: fetchedProjectWithRel, error: fetchRelErr } = await clientA
    .from('projects')
    .select(`
      *,
      client:clients(*),
      rooms(*)
    `)
    .eq('id', projectRecordA.id)
    .single();

  if (fetchRelErr) throw new Error(`Failed to query project relationships: ${fetchRelErr.message}`);
  
  if (fetchedProjectWithRel.client?.name !== 'Snehil Pandey') {
    throw new Error(`Relationship failure: expected client 'Snehil Pandey', got '${fetchedProjectWithRel.client?.name}'`);
  }
  if (fetchedProjectWithRel.rooms?.length !== 3) {
    throw new Error(`Relationship failure: expected 3 rooms, got ${fetchedProjectWithRel.rooms?.length}`);
  }
  console.log(`✅ Verified Project -> Client relation: "${fetchedProjectWithRel.client.name}"`);
  console.log(`✅ Verified Project -> Rooms relation: ${fetchedProjectWithRel.rooms.length} rooms linked correctly`);

  console.log('\n--- 4. MULTI-TENANT RLS CROSS-TENANT ISOLATION SECURITY TEST ---');
  
  // Test 4.1: User B tries to SELECT User A's Client
  const { data: bSelectClient, error: bSelectClientErr } = await clientB
    .from('clients')
    .select('*')
    .eq('id', clientRecordA.id);

  if (bSelectClient && bSelectClient.length > 0) {
    throw new Error(`❌ RLS VIOLATION: User B was able to SELECT User A client!`);
  }
  console.log('🔒 PASS: User B SELECT User A client returned 0 rows (Blocked by RLS).');

  // Test 4.2: User B tries to SELECT User A's Project
  const { data: bSelectProj, error: bSelectProjErr } = await clientB
    .from('projects')
    .select('*')
    .eq('id', projectRecordA.id);

  if (bSelectProj && bSelectProj.length > 0) {
    throw new Error(`❌ RLS VIOLATION: User B was able to SELECT User A project!`);
  }
  console.log('🔒 PASS: User B SELECT User A project returned 0 rows (Blocked by RLS).');

  // Test 4.3: User B tries to SELECT User A's Rooms
  const { data: bSelectRooms, error: bSelectRoomsErr } = await clientB
    .from('rooms')
    .select('*')
    .eq('project_id', projectRecordA.id);

  if (bSelectRooms && bSelectRooms.length > 0) {
    throw new Error(`❌ RLS VIOLATION: User B was able to SELECT User A rooms!`);
  }
  console.log('🔒 PASS: User B SELECT User A rooms returned 0 rows (Blocked by RLS).');

  // Test 4.4: User B tries to UPDATE User A's Project
  const { data: bUpdateProj, error: bUpdateProjErr } = await clientB
    .from('projects')
    .update({ name: 'Hacked Project Name' })
    .eq('id', projectRecordA.id)
    .select();

  if (bUpdateProj && bUpdateProj.length > 0) {
    throw new Error(`❌ RLS VIOLATION: User B was able to UPDATE User A project!`);
  }
  console.log('🔒 PASS: User B UPDATE User A project modified 0 rows (Blocked by RLS).');

  // Test 4.5: User B tries to DELETE User A's Client
  const { data: bDeleteClient, error: bDeleteClientErr } = await clientB
    .from('clients')
    .delete()
    .eq('id', clientRecordA.id)
    .select();

  if (bDeleteClient && bDeleteClient.length > 0) {
    throw new Error(`❌ RLS VIOLATION: User B was able to DELETE User A client!`);
  }
  console.log('🔒 PASS: User B DELETE User A client deleted 0 rows (Blocked by RLS).');

  // Test 4.6: User B creates its own isolated client & project
  const { data: clientRecordB, error: clientBErr } = await clientB
    .from('clients')
    .insert({
      organization_id: organizationBId,
      name: 'Ramesh Sharma',
      phone: '+91 99999 88888',
      email: 'ramesh@sharma.in'
    })
    .select()
    .single();

  if (clientBErr) throw new Error(`User B client creation failed: ${clientBErr.message}`);
  console.log('✅ User B created own client successfully:', clientRecordB.name, 'ID:', clientRecordB.id);

  // User A cannot see User B's client
  const { data: aSelectClientB } = await clientA
    .from('clients')
    .select('*')
    .eq('id', clientRecordB.id);

  if (aSelectClientB && aSelectClientB.length > 0) {
    throw new Error(`❌ RLS VIOLATION: User A was able to SELECT User B client!`);
  }
  console.log('🔒 PASS: User A SELECT User B client returned 0 rows (Bidirectional RLS verified).');

  console.log('\n--- 5. RECORD UPDATE & EDIT TEST ---');
  // Update Room budget and progress
  const roomToUpdate = createdRoomsA[0];
  const { data: updatedRoom, error: updateRoomErr } = await clientA
    .from('rooms')
    .update({
      budget: 85000,
      progress: 35,
      notes: 'Updated lighting specs and false ceiling framing done.'
    })
    .eq('id', roomToUpdate.id)
    .select()
    .single();

  if (updateRoomErr) throw new Error(`Room update failed: ${updateRoomErr.message}`);
  console.log(`✅ Room Updated: ${updatedRoom.name} -> New Budget: ₹${updatedRoom.budget}, Progress: ${updatedRoom.progress}%`);

  console.log('\n--- 6. REFRESH & PERSISTENCE SIMULATION TEST ---');
  // Re-fetch everything as User A to simulate page reload
  const { data: reloadedClients } = await clientA.from('clients').select('*').eq('organization_id', organizationAId);
  const { data: reloadedProjects } = await clientA.from('projects').select('*, rooms(*)').eq('organization_id', organizationAId);

  console.log(`✅ Persistence check: Found ${reloadedClients?.length} clients, ${reloadedProjects?.length} projects, and ${reloadedProjects?.[0]?.rooms?.length} rooms in DB.`);

  console.log('\n====================================================');
  console.log('🎉 ALL PHASE 4 TESTS PASSED REMOTELY ON SUPABASE!');
  console.log('====================================================');
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
