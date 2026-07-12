require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./pool');

const DEMO_PASSWORD_HASH_ROUNDS = 10;

const departments = [
  { slug: 'ENG', name: 'Engineering', code: 'ENG' },
  { slug: 'OPS', name: 'Operations', code: 'OPS' },
  { slug: 'HR', name: 'Human Resources', code: 'HR' },
  { slug: 'FIN', name: 'Finance', code: 'FIN' },
];

const users = [
  { slug: 'admin', name: 'Admin User', email: 'admin@holdit.app', role: 'ADMIN', dept: null },
  { slug: 'manager', name: 'Aditya Kulkarni', email: 'manager@holdit.app', role: 'ASSET_MANAGER', dept: 'OPS' },
  { slug: 'head', name: 'Meera Iyer', email: 'head@holdit.app', role: 'DEPARTMENT_HEAD', dept: 'ENG' },
  { slug: 'employee', name: 'Employee User', email: 'employee@holdit.app', role: 'EMPLOYEE', dept: 'ENG' },
  { slug: 'priya', name: 'Priya Sharma', email: 'priya.sharma@holdit.app', role: 'EMPLOYEE', dept: 'ENG' },
  { slug: 'raj', name: 'Raj Mehta', email: 'raj.mehta@holdit.app', role: 'EMPLOYEE', dept: 'OPS' },
  { slug: 'anita', name: 'Anita Verma', email: 'anita.verma@holdit.app', role: 'EMPLOYEE', dept: 'HR' },
  { slug: 'vikram', name: 'Vikram Nair', email: 'vikram.nair@holdit.app', role: 'EMPLOYEE', dept: 'FIN' },
];

const categories = [
  {
    slug: 'laptops',
    name: 'Laptops',
    fields: [
      { key: 'ram_gb', label: 'RAM (GB)', type: 'number' },
      { key: 'warranty_until', label: 'Warranty Until', type: 'date' },
    ],
  },
  {
    slug: 'furniture',
    name: 'Furniture',
    fields: [{ key: 'material', label: 'Material', type: 'text' }],
  },
  {
    slug: 'vehicles',
    name: 'Vehicles',
    fields: [
      { key: 'plate_number', label: 'Plate Number', type: 'text' },
      { key: 'fuel_type', label: 'Fuel Type', type: 'text' },
    ],
  },
  {
    slug: 'peripherals',
    name: 'Peripherals & Electronics',
    fields: [{ key: 'brand', label: 'Brand', type: 'text' }],
  },
  {
    slug: 'meeting_rooms',
    name: 'Meeting Rooms',
    fields: [{ key: 'capacity', label: 'Capacity', type: 'number' }],
  },
];

// status is the STARTING status this seed inserts; allocation/maintenance
// inserts below move some of these into ALLOCATED / UNDER_MAINTENANCE to
// match the allocation and maintenance records seeded further down.
const assets = [
  { slug: 'laptop_dell_xps', name: 'Dell XPS 15', category: 'laptops', location: 'Engineering Floor', cost: 145000, status: 'ALLOCATED' },
  { slug: 'laptop_mac_air', name: 'MacBook Air M2', category: 'laptops', location: 'Operations Floor', cost: 119000, status: 'ALLOCATED' },
  { slug: 'laptop_thinkpad', name: 'ThinkPad X1 Carbon', category: 'laptops', location: 'HR Floor', cost: 132000, status: 'ALLOCATED' },
  { slug: 'laptop_hp_elite', name: 'HP EliteBook 840', category: 'laptops', location: 'Engineering Floor', cost: 98000, status: 'AVAILABLE' },
  { slug: 'laptop_dell_inspiron', name: 'Dell Inspiron 14', category: 'laptops', location: 'Engineering Floor', cost: 65000, status: 'UNDER_MAINTENANCE' },

  { slug: 'furniture_standing_desk', name: 'Standing Desk', category: 'furniture', location: 'Finance Floor', cost: 22000, status: 'ALLOCATED' },
  { slug: 'furniture_office_chair_1', name: 'Ergonomic Office Chair', category: 'furniture', location: 'Engineering Floor', cost: 14500, status: 'AVAILABLE' },
  { slug: 'furniture_office_chair_2', name: 'Ergonomic Office Chair (2)', category: 'furniture', location: 'Operations Floor', cost: 14500, status: 'AVAILABLE' },
  { slug: 'furniture_bookshelf', name: 'Modular Bookshelf', category: 'furniture', location: 'Storage', cost: 9000, status: 'RETIRED' },
  { slug: 'furniture_meeting_table', name: 'Meeting Table (8-seat)', category: 'furniture', location: 'HQ - Floor 2', cost: 48000, status: 'UNDER_MAINTENANCE' },

  { slug: 'vehicle_innova', name: 'Toyota Innova', category: 'vehicles', location: 'Parking Bay 1', cost: 1450000, status: 'ALLOCATED' },
  { slug: 'vehicle_swift', name: 'Maruti Swift', category: 'vehicles', location: 'Parking Bay 2', cost: 650000, status: 'AVAILABLE', bookable: true },
  { slug: 'vehicle_activa', name: 'Honda Activa', category: 'vehicles', location: 'Parking Bay 3', cost: 85000, status: 'AVAILABLE', bookable: true },
  { slug: 'vehicle_bolero', name: 'Mahindra Bolero', category: 'vehicles', location: 'Parking Bay 4', cost: 950000, status: 'UNDER_MAINTENANCE' },
  { slug: 'vehicle_golf_cart', name: 'Utility Golf Cart', category: 'vehicles', location: 'Unknown', cost: 210000, status: 'LOST' },

  { slug: 'peripheral_projector_1', name: 'Epson Projector', category: 'peripherals', location: 'HQ - Floor 2', cost: 42000, status: 'AVAILABLE', bookable: true },
  { slug: 'peripheral_projector_2', name: 'BenQ Projector', category: 'peripherals', location: 'HQ - Floor 2', cost: 39000, status: 'AVAILABLE' },
  { slug: 'peripheral_camera', name: 'Canon DSLR Camera', category: 'peripherals', location: 'Engineering Floor', cost: 78000, status: 'AVAILABLE' },
  { slug: 'peripheral_monitor', name: 'Dell 27-inch Monitor', category: 'peripherals', location: 'Engineering Floor', cost: 24000, status: 'AVAILABLE' },
  { slug: 'peripheral_printer', name: 'HP LaserJet Printer', category: 'peripherals', location: 'Operations Floor', cost: 31000, status: 'AVAILABLE' },

  { slug: 'room_alpha', name: 'Meeting Room Alpha', category: 'meeting_rooms', location: 'HQ - Floor 2', cost: null, status: 'AVAILABLE', bookable: true },
  { slug: 'room_beta', name: 'Meeting Room Beta', category: 'meeting_rooms', location: 'HQ - Floor 2', cost: null, status: 'AVAILABLE', bookable: true },
  { slug: 'room_gamma', name: 'Meeting Room Gamma', category: 'meeting_rooms', location: 'HQ - Floor 3', cost: null, status: 'AVAILABLE', bookable: true },
  { slug: 'room_delta', name: 'Huddle Room Delta', category: 'meeting_rooms', location: 'HQ - Floor 3', cost: null, status: 'AVAILABLE', bookable: true },
  { slug: 'room_focus_pod', name: 'Focus Pod 1', category: 'meeting_rooms', location: 'HQ - Floor 3', cost: null, status: 'AVAILABLE', bookable: true },
];

async function truncateAll(client) {
  await client.query(`
    TRUNCATE TABLE
      activity_logs, audit_items, audit_cycle_auditors, audit_cycles,
      maintenance_requests, bookings, transfer_requests, allocations,
      assets, asset_categories, users, departments
    RESTART IDENTITY CASCADE
  `);
  await client.query(`ALTER SEQUENCE asset_tag_seq RESTART WITH 1`);
}

async function insertDepartments(client) {
  const ids = {};
  for (const dept of departments) {
    const result = await client.query(
      `INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING id`,
      [dept.name, dept.code]
    );
    ids[dept.slug] = result.rows[0].id;
  }
  return ids;
}

async function insertUsers(client, deptIds) {
  const passwordHash = await bcrypt.hash('Demo@123', DEMO_PASSWORD_HASH_ROUNDS);
  const ids = {};
  for (const user of users) {
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role, department_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user.name, user.email, passwordHash, user.role, user.dept ? deptIds[user.dept] : null]
    );
    ids[user.slug] = result.rows[0].id;
  }
  await client.query(`UPDATE departments SET head_user_id = $1 WHERE id = $2`, [
    ids.head,
    deptIds.ENG,
  ]);
  return ids;
}

async function insertCategories(client) {
  const ids = {};
  for (const category of categories) {
    const result = await client.query(
      `INSERT INTO asset_categories (name, custom_fields) VALUES ($1, $2::jsonb) RETURNING id`,
      [category.name, JSON.stringify(category.fields)]
    );
    ids[category.slug] = result.rows[0].id;
  }
  return ids;
}

async function insertAssets(client, categoryIds) {
  const ids = {};
  for (const asset of assets) {
    const result = await client.query(
      `INSERT INTO assets (name, category_id, acquisition_date, acquisition_cost, location, is_bookable, status)
       VALUES ($1, $2, CURRENT_DATE - INTERVAL '180 days', $3, $4, $5, $6)
       RETURNING id, asset_tag`,
      [
        asset.name,
        categoryIds[asset.category],
        asset.cost,
        asset.location,
        Boolean(asset.bookable),
        asset.status,
      ]
    );
    ids[asset.slug] = result.rows[0].id;
  }
  return ids;
}

async function insertAllocations(client, assetIds, userIds, deptIds) {
  const active = [
    { asset: 'laptop_dell_xps', employee: 'priya', daysAgo: 20, dueInDays: 30 },
    { asset: 'laptop_mac_air', employee: 'raj', daysAgo: 40, dueInDays: -10 },
    { asset: 'laptop_thinkpad', employee: 'anita', daysAgo: 35, dueInDays: -3 },
    { asset: 'furniture_standing_desk', employee: 'vikram', daysAgo: 15, dueInDays: 45 },
  ];
  for (const a of active) {
    await client.query(
      `INSERT INTO allocations (asset_id, holder_type, employee_id, expected_return_date, allocated_at)
       VALUES ($1, 'EMPLOYEE', $2, CURRENT_DATE + make_interval(days => $3), now() - make_interval(days => $4))`,
      [assetIds[a.asset], userIds[a.employee], a.dueInDays, a.daysAgo]
    );
  }

  await client.query(
    `INSERT INTO allocations (asset_id, holder_type, department_id, expected_return_date, allocated_at)
     VALUES ($1, 'DEPARTMENT', $2, CURRENT_DATE + INTERVAL '60 days', now() - INTERVAL '10 days')`,
    [assetIds.vehicle_innova, deptIds.OPS]
  );

  await client.query(
    `INSERT INTO allocations
       (asset_id, holder_type, employee_id, expected_return_date, allocated_at, status, returned_at, return_condition, return_notes)
     VALUES ($1, 'EMPLOYEE', $2, CURRENT_DATE - INTERVAL '5 days', now() - INTERVAL '25 days',
             'RETURNED', now() - INTERVAL '5 days', 'GOOD', 'Returned in working condition, minor scuff on the case.')`,
    [assetIds.peripheral_projector_2, userIds.employee]
  );
}

async function insertBookings(client, assetIds, userIds) {
  const bookings = [
    { asset: 'room_alpha', by: 'employee', start: "CURRENT_DATE + TIME '09:00'", end: "CURRENT_DATE + TIME '10:00'", purpose: 'Client demo walkthrough', status: 'CONFIRMED' },
    { asset: 'room_alpha', by: 'raj', start: "CURRENT_DATE + TIME '14:00'", end: "CURRENT_DATE + TIME '15:00'", purpose: 'Sprint planning', status: 'CONFIRMED' },
    { asset: 'room_beta', by: 'anita', start: "CURRENT_DATE + INTERVAL '1 day' + TIME '11:00'", end: "CURRENT_DATE + INTERVAL '1 day' + TIME '12:00'", purpose: 'HR onboarding session', status: 'CONFIRMED' },
    { asset: 'vehicle_swift', by: 'vikram', start: "CURRENT_DATE - INTERVAL '2 days' + TIME '09:00'", end: "CURRENT_DATE - INTERVAL '2 days' + TIME '13:00'", purpose: 'Vendor site visit', status: 'CONFIRMED' },
    { asset: 'peripheral_projector_1', by: 'priya', start: "CURRENT_DATE + INTERVAL '3 days' + TIME '10:00'", end: "CURRENT_DATE + INTERVAL '3 days' + TIME '11:00'", purpose: 'Town hall presentation', status: 'CONFIRMED' },
  ];
  for (const b of bookings) {
    await client.query(
      `INSERT INTO bookings (asset_id, booked_by, start_time, end_time, purpose, status)
       VALUES ($1, $2, ${b.start}, ${b.end}, $3, $4)`,
      [assetIds[b.asset], userIds[b.by], b.purpose, b.status]
    );
  }
}

async function insertMaintenanceRequests(client, assetIds, userIds) {
  const requests = [
    { asset: 'peripheral_monitor', by: 'employee', issue: 'Screen flickers intermittently after power-on.', priority: 'MEDIUM', status: 'PENDING' },
    { asset: 'laptop_dell_inspiron', by: 'priya', issue: 'Battery drains from full in under an hour.', priority: 'HIGH', status: 'APPROVED', decidedBy: 'manager' },
    { asset: 'furniture_meeting_table', by: 'anita', issue: 'Table surface veneer is chipped and needs repair.', priority: 'LOW', status: 'TECHNICIAN_ASSIGNED', decidedBy: 'manager', technician: 'Suresh Carpentry Works' },
    { asset: 'vehicle_bolero', by: 'raj', issue: 'Unusual engine noise on startup.', priority: 'URGENT', status: 'IN_PROGRESS', decidedBy: 'manager', technician: 'AutoCare Garage' },
    { asset: 'peripheral_printer', by: 'vikram', issue: 'Paper jam on every duplex print job.', priority: 'MEDIUM', status: 'RESOLVED', decidedBy: 'manager', technician: 'OfficeTech Services', resolvedDaysAgo: 2 },
  ];
  for (const r of requests) {
    await client.query(
      `INSERT INTO maintenance_requests
         (asset_id, raised_by, issue_description, priority, status, decided_by, technician_name, resolved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7,
               ${r.resolvedDaysAgo ? `now() - make_interval(days => ${r.resolvedDaysAgo})` : 'NULL'})`,
      [
        assetIds[r.asset],
        userIds[r.by],
        r.issue,
        r.priority,
        r.status,
        r.decidedBy ? userIds[r.decidedBy] : null,
        r.technician || null,
      ]
    );
  }
}

async function insertAuditCycle(client, assetIds, userIds) {
  const cycle = await client.query(
    `INSERT INTO audit_cycles (name, location, start_date, end_date, created_by)
     VALUES ('HQ Floor 2 Spot Check', 'HQ - Floor 2', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', $1)
     RETURNING id`,
    [userIds.admin]
  );
  const cycleId = cycle.rows[0].id;

  await client.query(
    `INSERT INTO audit_cycle_auditors (cycle_id, user_id) VALUES ($1, $2)`,
    [cycleId, userIds.head]
  );

  const items = [
    { asset: 'furniture_meeting_table', verification: null },
    { asset: 'peripheral_projector_1', verification: 'VERIFIED' },
    { asset: 'peripheral_projector_2', verification: 'VERIFIED' },
    { asset: 'room_beta', verification: null },
    { asset: 'room_delta', verification: 'MISSING' },
  ];
  for (const item of items) {
    await client.query(
      `INSERT INTO audit_items (cycle_id, asset_id, verification, verified_by, verified_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        cycleId,
        assetIds[item.asset],
        item.verification,
        item.verification ? userIds.head : null,
        item.verification ? new Date() : null,
      ]
    );
  }
}

async function insertActivityLogs(client, assetIds, userIds) {
  const logs = [
    { actor: 'manager', action: 'ASSET_REGISTERED', entityType: 'ASSET', entity: 'laptop_dell_xps', message: 'Registered asset Dell XPS 15', daysAgo: 25 },
    { actor: 'manager', action: 'ALLOCATION_CREATED', entityType: 'ALLOCATION', entity: 'laptop_dell_xps', message: 'Allocated Dell XPS 15 to Priya Sharma', daysAgo: 20 },
    { actor: 'employee', action: 'BOOKING_CREATED', entityType: 'BOOKING', entity: 'room_alpha', message: 'Booked Meeting Room Alpha for 9:00-10:00 today', daysAgo: 0 },
    { actor: 'priya', action: 'MAINTENANCE_RAISED', entityType: 'MAINTENANCE_REQUEST', entity: 'laptop_dell_inspiron', message: 'Raised maintenance request for Dell Inspiron 14', daysAgo: 4 },
    { actor: 'manager', action: 'MAINTENANCE_APPROVED', entityType: 'MAINTENANCE_REQUEST', entity: 'laptop_dell_inspiron', message: 'Approved maintenance request for Dell Inspiron 14', daysAgo: 3 },
    { actor: 'admin', action: 'AUDIT_CYCLE_OPENED', entityType: 'AUDIT_CYCLE', entity: null, message: "Opened audit cycle 'HQ Floor 2 Spot Check'", daysAgo: 3 },
    { actor: 'head', action: 'AUDIT_ITEM_VERIFIED', entityType: 'AUDIT_ITEM', entity: 'peripheral_projector_1', message: 'Verified Epson Projector present at HQ - Floor 2', daysAgo: 2 },
    { actor: 'manager', action: 'MAINTENANCE_RESOLVED', entityType: 'MAINTENANCE_REQUEST', entity: 'peripheral_printer', message: 'Resolved maintenance request for HP LaserJet Printer', daysAgo: 2 },
  ];
  for (const log of logs) {
    await client.query(
      `INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, message, created_at)
       VALUES ($1, $2, $3, $4, $5, now() - make_interval(days => $6))`,
      [
        userIds[log.actor],
        log.action,
        log.entityType,
        log.entity ? assetIds[log.entity] : null,
        log.message,
        log.daysAgo,
      ]
    );
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await truncateAll(client);

    const deptIds = await insertDepartments(client);
    const userIds = await insertUsers(client, deptIds);
    const categoryIds = await insertCategories(client);
    const assetIds = await insertAssets(client, categoryIds);

    await insertAllocations(client, assetIds, userIds, deptIds);
    await insertBookings(client, assetIds, userIds);
    await insertMaintenanceRequests(client, assetIds, userIds);
    await insertAuditCycle(client, assetIds, userIds);
    await insertActivityLogs(client, assetIds, userIds);

    await client.query('COMMIT');

    console.log('Seed complete.');
    console.log(`  ${departments.length} departments, ${users.length} users, ${categories.length} categories, ${assets.length} assets`);
    console.log('  Demo accounts (password: Demo@123):');
    for (const u of users.filter((u) => ['admin', 'manager', 'head', 'employee'].includes(u.slug))) {
      console.log(`    ${u.role.padEnd(16)} ${u.email}`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Seed failed:', err.message);
    pool.end();
    process.exit(1);
  });
