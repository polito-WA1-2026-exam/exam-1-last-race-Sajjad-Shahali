import express from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { getLines, getStations, getSegments, getSegmentLines, getLineStations } from '../dao/networkDao.js';
import { getBestScores } from '../dao/gameDao.js';

const router = express.Router();

// GET /api/instructions – public
router.get('/instructions', (req, res) => {
  res.json({
    title: 'Last Race – How to Play',
    text: `Welcome to Last Race! You are assigned a starting station and a destination within a fictional underground metro network.
You have 90 seconds to plan your route by selecting segments (connected station pairs) in order.
Your route must be valid: it must start and end at the assigned stations, use real segments, and only change metro lines at interchange stations.
For each segment of a valid route, a random event occurs, gaining or losing coins. Start with 20 coins.
The final score is the number of coins remaining (minimum 0). Registered users can view the general ranking of best scores.
Login to play!`
  });
});

// GET /api/game/setup – full network for setup map (authenticated)
router.get('/game/setup', isLoggedIn, async (req, res) => {
  try {
    const [lines, stations, segments, segmentLines, lineStations] = await Promise.all([
      getLines(), getStations(), getSegments(), getSegmentLines(), getLineStations()
    ]);

    // Build segments with station names
    const stationMap = {};
    for (const s of stations) stationMap[s.id] = s;

    const enrichedSegments = segments.map(seg => ({
      id: seg.id,
      station_a_id: seg.station_a_id,
      station_b_id: seg.station_b_id,
      station_a_name: stationMap[seg.station_a_id]?.name,
      station_b_name: stationMap[seg.station_b_id]?.name
    }));

    // Attach line colors to lineStations for rendering
    const lineMap = {};
    for (const l of lines) lineMap[l.id] = l;

    res.json({ lines, stations, segments: enrichedSegments, lineStations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load network data.' });
  }
});

// GET /api/ranking – authenticated
router.get('/ranking', isLoggedIn, async (req, res) => {
  try {
    const scores = await getBestScores();
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ranking.' });
  }
});

export default router;
