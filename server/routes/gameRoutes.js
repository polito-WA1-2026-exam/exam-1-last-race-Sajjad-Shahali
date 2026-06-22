import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { isLoggedIn } from '../middleware/auth.js';
import {
  createGame, getGameById, saveRouteDraft, getGameRoute,
  updateGamePhase, addGameEvent, getGameEvents, runInTransaction
} from '../dao/gameDao.js';
import { getSegments, getSegmentLines, getLineStations, getStations, getEvents } from '../dao/networkDao.js';
import { findValidStartDestination } from '../utils/bfs.js';
import { validateRoute } from '../utils/validateRoute.js';

const router = express.Router();

// Shared: build line maps and validate a route against the network
async function validateRouteWithNetwork(game, segmentIds) {
  const [allSegments, segmentLinesRaw, lineStationsRaw, stations] = await Promise.all([
    getSegments(), getSegmentLines(), getLineStations(), getStations()
  ]);
  const segmentLinesMap = {};
  for (const sl of segmentLinesRaw) {
    if (!segmentLinesMap[sl.segment_id]) segmentLinesMap[sl.segment_id] = [];
    segmentLinesMap[sl.segment_id].push(sl.line_id);
  }
  const stationLinesMap = {};
  for (const ls of lineStationsRaw) {
    if (!stationLinesMap[ls.station_id]) stationLinesMap[ls.station_id] = [];
    stationLinesMap[ls.station_id].push(ls.line_id);
  }
  const stationMap = {};
  for (const s of stations) stationMap[s.id] = s;
  return { ...validateRoute(game, segmentIds, allSegments, segmentLinesMap, stationLinesMap, stationMap), allSegments };
}

// Helper: auto-submit a planning-phase game if its deadline has passed
async function autoSubmitIfExpired(game) {
  if (game.phase !== 'planning') return game;
  if (new Date() <= new Date(game.planning_deadline_at)) return game;

  const submittedAt = new Date().toISOString();
  const draft = await getGameRoute(game.id);
  const segmentIds = draft.map(r => r.segment_id);

  const { valid, reason } = await validateRouteWithNetwork(game, segmentIds);

  if (valid) {
    await updateGamePhase(game.id, 'execution', { route_is_valid: true, submitted_at: submittedAt, execution_index: 0 });
  } else {
    await updateGamePhase(game.id, 'result', { route_is_valid: false, submitted_at: submittedAt, coins: 0, final_score: 0, completed_at: submittedAt, invalid_reason: reason });
  }
  return await getGameById(game.id);
}

// POST /api/games – create new game
router.post('/games', isLoggedIn, async (req, res) => {
  try {
    const segments = await getSegments();
    const pair = findValidStartDestination(segments, 3);
    if (!pair) return res.status(500).json({ error: 'Could not find valid start/destination pair.' });

    const deadline = new Date(Date.now() + 90 * 1000).toISOString();
    const result = await createGame(req.user.id, pair.start, pair.dest, deadline);
    const gameId = result.lastID;

    // Return planning data (no line info)
    const stations = await getStations();
    const stationMap = {};
    for (const s of stations) stationMap[s.id] = s;

    const enrichedSegments = segments.map(seg => ({
      id: seg.id,
      station_a_id: seg.station_a_id,
      station_b_id: seg.station_b_id,
      station_a_name: stationMap[seg.station_a_id]?.name,
      station_b_name: stationMap[seg.station_b_id]?.name
    }));

    res.status(201).json({
      gameId,
      startStation: stationMap[pair.start],
      destinationStation: stationMap[pair.dest],
      deadline,
      stations,
      segments: enrichedSegments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create game.' });
  }
});

// GET /api/games/:gameId – get game state
router.get('/games/:gameId',
  isLoggedIn,
  [param('gameId').isInt({ min: 1 }).toInt()],
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid game ID.' });
  try {
    let game = await getGameById(req.params.gameId);
    if (!game) return res.status(404).json({ error: 'Game not found.' });
    if (game.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });

    // Auto-submit if planning deadline passed (handles navigation-away case)
    game = await autoSubmitIfExpired(game);

    const [stations, allSegments, route] = await Promise.all([
      getStations(), getSegments(), getGameRoute(game.id)
    ]);

    const stationMap = {};
    for (const s of stations) stationMap[s.id] = s;

    const enrichedSegments = allSegments.map(seg => ({
      id: seg.id,
      station_a_id: seg.station_a_id,
      station_b_id: seg.station_b_id,
      station_a_name: stationMap[seg.station_a_id]?.name,
      station_b_name: stationMap[seg.station_b_id]?.name
    }));

    let response = {
      id: game.id,
      phase: game.phase,
      startStation: stationMap[game.start_station_id],
      destinationStation: stationMap[game.destination_station_id],
      coins: game.coins,
      finalScore: game.final_score,
      routeIsValid: game.route_is_valid === 1,
      invalidReason: game.invalid_reason ?? null,
      executionIndex: game.execution_index,
      deadline: game.planning_deadline_at,
      routeSegmentIds: route.map(r => r.segment_id),
      stations,
      segments: enrichedSegments
    };

    if (game.phase === 'execution' || game.phase === 'result') {
      const events = await getGameEvents(game.id);
      response.events = events;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load game.' });
  }
});

// PUT /api/games/:gameId/route – save draft route
router.put('/games/:gameId/route',
  isLoggedIn,
  [
    param('gameId').isInt({ min: 1 }).toInt(),
    body('segments').isArray({ max: 30 }),
    body('segments.*').isInt({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const game = await getGameById(req.params.gameId);
      if (!game) return res.status(404).json({ error: 'Game not found.' });
      if (game.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
      if (game.phase !== 'planning') return res.status(409).json({ error: 'Game not in planning phase.' });
      if (new Date() > new Date(game.planning_deadline_at)) {
        return res.status(409).json({ error: 'Planning deadline has passed.' });
      }

      await saveRouteDraft(game.id, req.body.segments);
      res.json({ saved: true });
    } catch (err) {
      console.error(err);
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(422).json({ error: 'One or more segment IDs are invalid.' });
      }
      res.status(500).json({ error: 'Failed to save route.' });
    }
  }
);

// POST /api/games/:gameId/submit – finalize planning phase
router.post('/games/:gameId/submit',
  isLoggedIn,
  [
    param('gameId').isInt({ min: 1 }).toInt(),
    body('segments').optional().isArray(),
    body('segments.*').optional().isInt({ min: 1 })
  ],
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const game = await getGameById(req.params.gameId);
    if (!game) return res.status(404).json({ error: 'Game not found.' });
    if (game.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
    if (game.phase !== 'planning') return res.status(409).json({ error: 'Game not in planning phase.' });

    const now = new Date();
    const submittedAt = now.toISOString();

    // Server-side deadline enforcement: use stored draft if late
    let segmentIds;
    const deadline = new Date(game.planning_deadline_at);

    if (now > deadline) {
      // Time expired – use whatever is stored in the draft
      const draft = await getGameRoute(game.id);
      segmentIds = draft.map(r => r.segment_id);
    } else {
      // Accept the submitted segments and save as draft
      segmentIds = req.body.segments || [];
      await saveRouteDraft(game.id, segmentIds);
    }

    const { valid, reason } = await validateRouteWithNetwork(game, segmentIds);

    if (valid) {
      await updateGamePhase(game.id, 'execution', {
        route_is_valid: true,
        submitted_at: submittedAt,
        execution_index: 0
      });
      res.json({ valid: true, phase: 'execution', gameId: game.id });
    } else {
      await updateGamePhase(game.id, 'result', {
        route_is_valid: false,
        submitted_at: submittedAt,
        coins: 0,
        final_score: 0,
        completed_at: submittedAt,
        invalid_reason: reason
      });
      res.json({ valid: false, phase: 'result', reason, gameId: game.id });
    }
  } catch (err) {
    console.error(err);
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(422).json({ error: 'One or more segment IDs are invalid.' });
    }
    res.status(500).json({ error: 'Failed to submit route.' });
  }
});

// POST /api/games/:gameId/execution/next – reveal next event
router.post('/games/:gameId/execution/next',
  isLoggedIn,
  [param('gameId').isInt({ min: 1 }).toInt()],
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid game ID.' });
  try {
    const game = await getGameById(req.params.gameId);
    if (!game) return res.status(404).json({ error: 'Game not found.' });
    if (game.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
    if (game.phase !== 'execution') return res.status(409).json({ error: 'Game not in execution phase.' });

    const route = await getGameRoute(game.id);
    const idx = game.execution_index;

    if (idx >= route.length) {
      return res.status(409).json({ error: 'All segments already revealed.' });
    }

    const segmentId = route[idx].segment_id;

    // Pick random event
    const events = await getEvents();
    const event = events[Math.floor(Math.random() * events.length)];

    const newCoins = game.coins + event.coin_effect;
    const newIndex = idx + 1;
    const done = newIndex >= route.length;
    const finalScore = done ? Math.max(0, newCoins) : undefined;

    // Get segment details and compute travel direction from start
    const [allSegments, stations] = await Promise.all([getSegments(), getStations()]);
    const segObj = allSegments.find(s => s.id === segmentId);
    const stationMap = {};
    for (const s of stations) stationMap[s.id] = s;

    // Walk from game start through already-revealed steps to find stationFrom at this step
    let walkId = game.start_station_id;
    for (let i = 0; i < idx; i++) {
      const prevSeg = allSegments.find(s => s.id === route[i].segment_id);
      walkId = prevSeg.station_a_id === walkId ? prevSeg.station_b_id : prevSeg.station_a_id;
    }
    const stationFromId = walkId;
    const stationToId = segObj.station_a_id === stationFromId ? segObj.station_b_id : segObj.station_a_id;

    // Save event + update game atomically
    await runInTransaction(async () => {
      await addGameEvent(game.id, newIndex, segmentId, event.id, event.coin_effect, newCoins, stationFromId, stationToId);
      if (done) {
        await updateGamePhase(game.id, 'result', {
          coins: newCoins, final_score: finalScore, execution_index: newIndex,
          completed_at: new Date().toISOString()
        });
      } else {
        await updateGamePhase(game.id, 'execution', { coins: newCoins, execution_index: newIndex });
      }
    });

    res.json({
      position: newIndex,
      segmentId,
      stationFrom: stationMap[stationFromId],
      stationTo: stationMap[stationToId],
      event: { description: event.description, coin_effect: event.coin_effect },
      coinsAfter: newCoins,
      done,
      finalScore: done ? finalScore : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reveal next event.' });
  }
});

export default router;
