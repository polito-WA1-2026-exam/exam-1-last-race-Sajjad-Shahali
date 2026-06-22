import db from '../db.js';

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export async function runInTransaction(fn) {
  await run('BEGIN');
  try {
    await fn();
    await run('COMMIT');
  } catch (err) {
    try { await run('ROLLBACK'); } catch {}
    throw err;
  }
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function createGame(userId, startStationId, destinationStationId, deadline) {
  const now = new Date().toISOString();
  return run(
    `INSERT INTO games (user_id, phase, start_station_id, destination_station_id,
      planning_started_at, planning_deadline_at, coins, created_at)
     VALUES (?,?,?,?,?,?,20,?)`,
    [userId, 'planning', startStationId, destinationStationId, now, deadline, now]
  );
}

export function getGameById(gameId) {
  return get('SELECT * FROM games WHERE id = ?', [gameId]);
}

export async function saveRouteDraft(gameId, segmentIds) {
  await runInTransaction(async () => {
    await run('DELETE FROM game_route_segments WHERE game_id = ?', [gameId]);
    for (let i = 0; i < segmentIds.length; i++) {
      await run(
        'INSERT INTO game_route_segments (game_id, position, segment_id) VALUES (?,?,?)',
        [gameId, i + 1, segmentIds[i]]
      );
    }
  });
}

export function getGameRoute(gameId) {
  return all(
    'SELECT * FROM game_route_segments WHERE game_id = ? ORDER BY position',
    [gameId]
  );
}

export function updateGamePhase(gameId, phase, extra = {}) {
  const fields = ['phase = ?'];
  const values = [phase];

  if (extra.route_is_valid !== undefined) {
    fields.push('route_is_valid = ?');
    values.push(extra.route_is_valid ? 1 : 0);
  }
  if (extra.coins !== undefined) {
    fields.push('coins = ?');
    values.push(extra.coins);
  }
  if (extra.final_score !== undefined) {
    fields.push('final_score = ?');
    values.push(extra.final_score);
  }
  if (extra.submitted_at !== undefined) {
    fields.push('submitted_at = ?');
    values.push(extra.submitted_at);
  }
  if (extra.completed_at !== undefined) {
    fields.push('completed_at = ?');
    values.push(extra.completed_at);
  }
  if (extra.execution_index !== undefined) {
    fields.push('execution_index = ?');
    values.push(extra.execution_index);
  }
  if (extra.invalid_reason !== undefined) {
    fields.push('invalid_reason = ?');
    values.push(extra.invalid_reason);
  }

  values.push(gameId);
  return run(`UPDATE games SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function addGameEvent(gameId, position, segmentId, eventId, effect, coinsAfter, stationFromId, stationToId) {
  return run(
    'INSERT INTO game_events (game_id, position, segment_id, event_id, effect, coins_after, station_from_id, station_to_id) VALUES (?,?,?,?,?,?,?,?)',
    [gameId, position, segmentId, eventId, effect, coinsAfter, stationFromId, stationToId]
  );
}

export function getGameEvents(gameId) {
  return all(
    `SELECT ge.*, e.description, s.station_a_id, s.station_b_id
     FROM game_events ge
     JOIN events e ON e.id = ge.event_id
     JOIN segments s ON s.id = ge.segment_id
     WHERE ge.game_id = ?
     ORDER BY ge.position`,
    [gameId]
  );
}

export function getBestScores() {
  return all(
    `SELECT u.username, u.display_name, MAX(g.final_score) as best_score
     FROM users u
     JOIN games g ON g.user_id = u.id
     WHERE g.phase = 'result' AND g.route_is_valid = 1
     GROUP BY u.id
     ORDER BY best_score DESC`,
    []
  );
}
