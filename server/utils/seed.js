import db from '../db.js';
import crypto from 'crypto';

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 32, (err, hash) => {
      if (err) reject(err);
      else resolve({ hash: hash.toString('hex'), salt });
    });
  });
}

export async function initDatabase() {
  await createTables();
  await migrateSchema();
  const existing = await get('SELECT COUNT(*) as cnt FROM users');
  if (existing.cnt === 0) {
    await seedData();
  }
}

async function migrateSchema() {
  // Add station_from_id / station_to_id to game_events if missing (SQLite schema migration)
  const cols = await new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(game_events)', (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
  const names = cols.map(c => c.name);
  if (!names.includes('station_from_id')) {
    await run('ALTER TABLE game_events ADD COLUMN station_from_id INTEGER');
  }
  if (!names.includes('station_to_id')) {
    await run('ALTER TABLE game_events ADD COLUMN station_to_id INTEGER');
  }

  // Add invalid_reason to games if missing
  const gameCols = await new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(games)', (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
  if (!gameCols.map(c => c.name).includes('invalid_reason')) {
    await run('ALTER TABLE games ADD COLUMN invalid_reason TEXT');
  }
}

async function createTables() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    display_name TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS metro_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    map_x INTEGER NOT NULL,
    map_y INTEGER NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS line_stations (
    line_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (line_id, station_id),
    FOREIGN KEY (line_id) REFERENCES metro_lines(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_a_id INTEGER NOT NULL,
    station_b_id INTEGER NOT NULL,
    FOREIGN KEY (station_a_id) REFERENCES stations(id),
    FOREIGN KEY (station_b_id) REFERENCES stations(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS segment_lines (
    segment_id INTEGER NOT NULL,
    line_id INTEGER NOT NULL,
    PRIMARY KEY (segment_id, line_id),
    FOREIGN KEY (segment_id) REFERENCES segments(id),
    FOREIGN KEY (line_id) REFERENCES metro_lines(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    coin_effect INTEGER NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    phase TEXT NOT NULL DEFAULT 'setup',
    start_station_id INTEGER,
    destination_station_id INTEGER,
    planning_started_at TEXT,
    planning_deadline_at TEXT,
    submitted_at TEXT,
    route_is_valid INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 20,
    final_score INTEGER DEFAULT 0,
    execution_index INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (start_station_id) REFERENCES stations(id),
    FOREIGN KEY (destination_station_id) REFERENCES stations(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS game_route_segments (
    game_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    segment_id INTEGER NOT NULL,
    PRIMARY KEY (game_id, position),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (segment_id) REFERENCES segments(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS game_events (
    game_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    segment_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    effect INTEGER NOT NULL,
    coins_after INTEGER NOT NULL,
    station_from_id INTEGER,
    station_to_id INTEGER,
    PRIMARY KEY (game_id, position),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (segment_id) REFERENCES segments(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  )`);
}

async function seedData() {
  // Users
  const alice  = await hashPassword('password123');
  const bob    = await hashPassword('password123');
  const carol  = await hashPassword('password123');
  const dave   = await hashPassword('password123');
  const eve    = await hashPassword('password123');
  const frank  = await hashPassword('password123');
  const grace  = await hashPassword('password123');
  const henry  = await hashPassword('password123');
  const ivan   = await hashPassword('password123');
  const julia  = await hashPassword('password123');

  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['alice', alice.hash, alice.salt, 'Alice']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['bob',   bob.hash,   bob.salt,   'Bob']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['carol', carol.hash, carol.salt, 'Carol']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['dave',  dave.hash,  dave.salt,  'Dave']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['eve',   eve.hash,   eve.salt,   'Eve']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['frank', frank.hash, frank.salt, 'Frank']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['grace', grace.hash, grace.salt, 'Grace']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['henry', henry.hash, henry.salt, 'Henry']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['ivan',  ivan.hash,  ivan.salt,  'Ivan']);
  await run(`INSERT INTO users (username, password_hash, salt, display_name) VALUES (?,?,?,?)`, ['julia', julia.hash, julia.salt, 'Julia']);

  // Metro lines
  await run(`INSERT INTO metro_lines (name, color) VALUES ('Red Line', '#e74c3c')`);
  await run(`INSERT INTO metro_lines (name, color) VALUES ('Blue Line', '#2980b9')`);
  await run(`INSERT INTO metro_lines (name, color) VALUES ('Green Line', '#27ae60')`);
  await run(`INSERT INTO metro_lines (name, color) VALUES ('Gold Line', '#f39c12')`);
  // line IDs: Red=1, Blue=2, Green=3, Gold=4

  // Stations with map coordinates
  // Red Line: Grand Central(1) -> Maple Square(2) -> Falcon Junction(3) -> Lantern Plaza(4) -> Harbor Gate(5)
  // Blue Line: Grand Central(1) -> Shadow Fountain(6) -> Riverside(7) -> Mosaic Avenue(8) -> North Terminal(9)
  // Green Line: Maple Square(2) -> Shadow Fountain(6) -> Cedar Tower(10) -> Echo Field(11) -> Hill Park(12)
  // Gold Line: Lantern Plaza(4) -> Cedar Tower(10) -> Mosaic Avenue(8) -> Echo Field(11) -> Market Hall(13)
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Grand Central', 300, 80)`);     // 1
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Maple Square', 160, 200)`);      // 2
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Falcon Junction', 80, 320)`);    // 3
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Lantern Plaza', 80, 440)`);      // 4
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Harbor Gate', 80, 560)`);        // 5
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Shadow Fountain', 440, 200)`);   // 6
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Riverside', 560, 200)`);         // 7
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Mosaic Avenue', 560, 320)`);     // 8
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('North Terminal', 560, 440)`);    // 9
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Cedar Tower', 320, 320)`);       // 10
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Echo Field', 440, 440)`);        // 11
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Hill Park', 200, 560)`);         // 12
  await run(`INSERT INTO stations (name, map_x, map_y) VALUES ('Market Hall', 560, 560)`);       // 13

  // Line stations (line_id, station_id, position)
  // Red Line (1): GC(1)→MS(2)→FJ(3)→LP(4)→HG(5)
  await run(`INSERT INTO line_stations VALUES (1,1,1)`);
  await run(`INSERT INTO line_stations VALUES (1,2,2)`);
  await run(`INSERT INTO line_stations VALUES (1,3,3)`);
  await run(`INSERT INTO line_stations VALUES (1,4,4)`);
  await run(`INSERT INTO line_stations VALUES (1,5,5)`);

  // Blue Line (2): GC(1)→SF(6)→RV(7)→MA(8)→NT(9)
  await run(`INSERT INTO line_stations VALUES (2,1,1)`);
  await run(`INSERT INTO line_stations VALUES (2,6,2)`);
  await run(`INSERT INTO line_stations VALUES (2,7,3)`);
  await run(`INSERT INTO line_stations VALUES (2,8,4)`);
  await run(`INSERT INTO line_stations VALUES (2,9,5)`);

  // Green Line (3): MS(2)→SF(6)→CT(10)→EF(11)→HP(12)
  await run(`INSERT INTO line_stations VALUES (3,2,1)`);
  await run(`INSERT INTO line_stations VALUES (3,6,2)`);
  await run(`INSERT INTO line_stations VALUES (3,10,3)`);
  await run(`INSERT INTO line_stations VALUES (3,11,4)`);
  await run(`INSERT INTO line_stations VALUES (3,12,5)`);

  // Gold Line (4): LP(4)→CT(10)→MA(8)→EF(11)→MH(13)
  await run(`INSERT INTO line_stations VALUES (4,4,1)`);
  await run(`INSERT INTO line_stations VALUES (4,10,2)`);
  await run(`INSERT INTO line_stations VALUES (4,8,3)`);
  await run(`INSERT INTO line_stations VALUES (4,11,4)`);
  await run(`INSERT INTO line_stations VALUES (4,13,5)`);

  // Segments (station_a_id, station_b_id) – undirected
  // Red Line segments
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (1,2)`); // 1: GC-MS
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (2,3)`); // 2: MS-FJ
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (3,4)`); // 3: FJ-LP
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (4,5)`); // 4: LP-HG

  // Blue Line segments
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (1,6)`); // 5: GC-SF
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (6,7)`); // 6: SF-RV
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (7,8)`); // 7: RV-MA
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (8,9)`); // 8: MA-NT

  // Green Line segments
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (2,6)`); // 9: MS-SF
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (6,10)`);// 10: SF-CT
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (10,11)`);// 11: CT-EF
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (11,12)`);// 12: EF-HP

  // Gold Line segments
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (4,10)`); // 13: LP-CT
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (10,8)`); // 14: CT-MA
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (8,11)`); // 15: MA-EF
  await run(`INSERT INTO segments (station_a_id, station_b_id) VALUES (11,13)`);// 16: EF-MH

  // Segment lines (which lines serve each segment)
  await run(`INSERT INTO segment_lines VALUES (1,1)`);   // GC-MS: Red
  await run(`INSERT INTO segment_lines VALUES (2,1)`);   // MS-FJ: Red
  await run(`INSERT INTO segment_lines VALUES (3,1)`);   // FJ-LP: Red
  await run(`INSERT INTO segment_lines VALUES (4,1)`);   // LP-HG: Red
  await run(`INSERT INTO segment_lines VALUES (5,2)`);   // GC-SF: Blue
  await run(`INSERT INTO segment_lines VALUES (6,2)`);   // SF-RV: Blue
  await run(`INSERT INTO segment_lines VALUES (7,2)`);   // RV-MA: Blue
  await run(`INSERT INTO segment_lines VALUES (8,2)`);   // MA-NT: Blue
  await run(`INSERT INTO segment_lines VALUES (9,3)`);   // MS-SF: Green
  await run(`INSERT INTO segment_lines VALUES (10,3)`);  // SF-CT: Green
  await run(`INSERT INTO segment_lines VALUES (11,3)`);  // CT-EF: Green
  await run(`INSERT INTO segment_lines VALUES (12,3)`);  // EF-HP: Green
  await run(`INSERT INTO segment_lines VALUES (13,4)`);  // LP-CT: Gold
  await run(`INSERT INTO segment_lines VALUES (14,4)`);  // CT-MA: Gold
  await run(`INSERT INTO segment_lines VALUES (15,4)`);  // MA-EF: Gold
  await run(`INSERT INTO segment_lines VALUES (16,4)`);  // EF-MH: Gold

  // Events (9 events, effects -4 to +4)
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Smooth journey – no delays', 0)`);
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Door delay – train held at platform', -1)`);
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Wrong platform sign – lost time', -2)`);
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Signal failure – long wait', -3)`);
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Missed connection – had to backtrack', -4)`);
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Friendly commuter gives directions', 1)`);
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Shortcut suggested by station staff', 2)`);
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Festival voucher found on seat', 3)`);
  await run(`INSERT INTO events (description, coin_effect) VALUES ('Bonus travel card dropped by passenger', 4)`);

  // Seed completed games for Alice (user 1) and Bob (user 2)
  const now = new Date().toISOString();

  // Alice game 1: valid route, score 22
  // Route: GC(1) → MS(2) via seg1, MS→SF via seg9 [interchange MS], SF→CT via seg10, CT→EF via seg11
  // 4 segments, coins: 20 + 4 + 0 + (-1) + 3 = 26... adjusted to score 22
  const g1res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (1,'result',1,11,'${now}','${now}','${now}',1,22,22,4,'${now}','${now}')`);
  const g1id = g1res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g1id},1,1)`);  // GC-MS
  await run(`INSERT INTO game_route_segments VALUES (${g1id},2,9)`);  // MS-SF
  await run(`INSERT INTO game_route_segments VALUES (${g1id},3,10)`); // SF-CT
  await run(`INSERT INTO game_route_segments VALUES (${g1id},4,11)`); // CT-EF
  // Alice events: 20 +4 +0 -1 -1 = 22 coins. station_from/to tracks travel direction.
  await run(`INSERT INTO game_events VALUES (${g1id},1,1,9,4,24,1,2)`);   // GC→MS, bonus +4
  await run(`INSERT INTO game_events VALUES (${g1id},2,9,1,0,24,2,6)`);   // MS→SF, smooth 0
  await run(`INSERT INTO game_events VALUES (${g1id},3,10,2,-1,23,6,10)`);// SF→CT, door -1
  await run(`INSERT INTO game_events VALUES (${g1id},4,11,2,-1,22,10,11)`);// CT→EF, door -1

  // Bob game 1: valid route, score 18
  // Route: GC(1)→SF(6) via seg5 (Blue), SF→CT(10) via seg10 [interchange SF], CT→EF(11) via seg11
  // 3 segments
  const g2res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (2,'result',1,11,'${now}','${now}','${now}',1,18,18,3,'${now}','${now}')`);
  const g2id = g2res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g2id},1,5)`);  // GC-SF
  await run(`INSERT INTO game_route_segments VALUES (${g2id},2,10)`); // SF-CT
  await run(`INSERT INTO game_route_segments VALUES (${g2id},3,11)`); // CT-EF
  // Bob events: 20 -1 +0 -1 = 18 coins.
  await run(`INSERT INTO game_events VALUES (${g2id},1,5,2,-1,19,1,6)`);   // GC→SF, door -1
  await run(`INSERT INTO game_events VALUES (${g2id},2,10,1,0,19,6,10)`);  // SF→CT, smooth 0
  await run(`INSERT INTO game_events VALUES (${g2id},3,11,2,-1,18,10,11)`);// CT→EF, door -1

  // Dave (user 4): score 15 — GC(1)→EF(11) via Blue then Green
  // segs: GC-SF(5), SF-CT(10)[SF interchange], CT-EF(11)
  const g3res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (4,'result',1,11,'${now}','${now}','${now}',1,15,15,3,'${now}','${now}')`);
  const g3id = g3res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g3id},1,5)`);
  await run(`INSERT INTO game_route_segments VALUES (${g3id},2,10)`);
  await run(`INSERT INTO game_route_segments VALUES (${g3id},3,11)`);
  // 20 -2 -1 -2 = 15
  await run(`INSERT INTO game_events VALUES (${g3id},1,5,3,-2,18,1,6)`);
  await run(`INSERT INTO game_events VALUES (${g3id},2,10,2,-1,17,6,10)`);
  await run(`INSERT INTO game_events VALUES (${g3id},3,11,3,-2,15,10,11)`);

  // Eve (user 5): score 24 — MS(2)→EF(11) via Green
  // segs: MS-SF(9), SF-CT(10), CT-EF(11)
  const g4res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (5,'result',2,11,'${now}','${now}','${now}',1,24,24,3,'${now}','${now}')`);
  const g4id = g4res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g4id},1,9)`);
  await run(`INSERT INTO game_route_segments VALUES (${g4id},2,10)`);
  await run(`INSERT INTO game_route_segments VALUES (${g4id},3,11)`);
  // 20 +4 +3 -3 = 24
  await run(`INSERT INTO game_events VALUES (${g4id},1,9,9,4,24,2,6)`);
  await run(`INSERT INTO game_events VALUES (${g4id},2,10,8,3,27,6,10)`);
  await run(`INSERT INTO game_events VALUES (${g4id},3,11,4,-3,24,10,11)`);

  // Frank (user 6): score 11 — LP(4)→MH(13) via Gold
  // segs: LP-CT(13), CT-MA(14), MA-EF(15)[MA interchange], EF-MH(16)
  const g5res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (6,'result',4,13,'${now}','${now}','${now}',1,11,11,4,'${now}','${now}')`);
  const g5id = g5res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g5id},1,13)`);
  await run(`INSERT INTO game_route_segments VALUES (${g5id},2,14)`);
  await run(`INSERT INTO game_route_segments VALUES (${g5id},3,15)`);
  await run(`INSERT INTO game_route_segments VALUES (${g5id},4,16)`);
  // 20 -3 -3 -2 -1 = 11
  await run(`INSERT INTO game_events VALUES (${g5id},1,13,4,-3,17,4,10)`);
  await run(`INSERT INTO game_events VALUES (${g5id},2,14,4,-3,14,10,8)`);
  await run(`INSERT INTO game_events VALUES (${g5id},3,15,3,-2,12,8,11)`);
  await run(`INSERT INTO game_events VALUES (${g5id},4,16,2,-1,11,11,13)`);

  // Grace (user 7): score 22 — RV(7)→HP(12) via Blue→Gold→Green
  // segs: RV-MA(7)[Blue], MA-EF(15)[Gold, MA interchange], EF-HP(12)[Green, EF interchange]
  const g6res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (7,'result',7,12,'${now}','${now}','${now}',1,22,22,3,'${now}','${now}')`);
  const g6id = g6res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g6id},1,7)`);
  await run(`INSERT INTO game_route_segments VALUES (${g6id},2,15)`);
  await run(`INSERT INTO game_route_segments VALUES (${g6id},3,12)`);
  // 20 +1 +2 -1 = 22
  await run(`INSERT INTO game_events VALUES (${g6id},1,7,6,1,21,7,8)`);
  await run(`INSERT INTO game_events VALUES (${g6id},2,15,7,2,23,8,11)`);
  await run(`INSERT INTO game_events VALUES (${g6id},3,12,2,-1,22,11,12)`);

  // Carol (user 3): score 19 — MS(2)→CT(10) via Green
  // segs: MS-SF(9), SF-CT(10)
  const g7res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (3,'result',2,10,'${now}','${now}','${now}',1,19,19,2,'${now}','${now}')`);
  const g7id = g7res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g7id},1,9)`);
  await run(`INSERT INTO game_route_segments VALUES (${g7id},2,10)`);
  // 20 +0 -1 = 19
  await run(`INSERT INTO game_events VALUES (${g7id},1,9,1,0,20,2,6)`);
  await run(`INSERT INTO game_events VALUES (${g7id},2,10,2,-1,19,6,10)`);

  // Henry (user 8): score 16 — GC(1)→FJ(3) via Red
  // segs: GC-MS(1), MS-FJ(2)
  const g8res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (8,'result',1,3,'${now}','${now}','${now}',1,16,16,2,'${now}','${now}')`);
  const g8id = g8res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g8id},1,1)`);
  await run(`INSERT INTO game_route_segments VALUES (${g8id},2,2)`);
  // 20 -2 -2 = 16
  await run(`INSERT INTO game_events VALUES (${g8id},1,1,3,-2,18,1,2)`);
  await run(`INSERT INTO game_events VALUES (${g8id},2,2,3,-2,16,2,3)`);

  // Ivan (user 9): score 26 — GC(1)→CT(10) via Blue→Green
  // segs: GC-SF(5), SF-CT(10)[SF interchange]
  const g9res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (9,'result',1,10,'${now}','${now}','${now}',1,26,26,2,'${now}','${now}')`);
  const g9id = g9res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g9id},1,5)`);
  await run(`INSERT INTO game_route_segments VALUES (${g9id},2,10)`);
  // 20 +4 +2 = 26
  await run(`INSERT INTO game_events VALUES (${g9id},1,5,9,4,24,1,6)`);
  await run(`INSERT INTO game_events VALUES (${g9id},2,10,7,2,26,6,10)`);

  // Julia (user 10): score 13 — RV(7)→NT(9) via Blue
  // segs: RV-MA(7), MA-NT(8)
  const g10res = await run(`INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
    planning_started_at, planning_deadline_at, submitted_at,
    route_is_valid, coins, final_score, execution_index, created_at, completed_at)
    VALUES (10,'result',7,9,'${now}','${now}','${now}',1,13,13,2,'${now}','${now}')`);
  const g10id = g10res.lastID;
  await run(`INSERT INTO game_route_segments VALUES (${g10id},1,7)`);
  await run(`INSERT INTO game_route_segments VALUES (${g10id},2,8)`);
  // 20 -4 -3 = 13
  await run(`INSERT INTO game_events VALUES (${g10id},1,7,5,-4,16,7,8)`);
  await run(`INSERT INTO game_events VALUES (${g10id},2,8,4,-3,13,8,9)`);

  console.log('Database seeded successfully.');
}
