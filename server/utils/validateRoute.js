/**
 * Validates a player's submitted route on the server.
 *
 * Algorithm uses candidate line set tracking:
 * - For first segment: candidateLines = all lines that serve it.
 * - For each next segment:
 *   - continuable = lines that serve both prev and current (same line)
 *   - If connecting station is an interchange (served by >1 line):
 *     switchable = all lines serving current segment
 *   - candidateLines = continuable ∪ switchable
 *   - If candidateLines empty → invalid (line change at non-interchange)
 *
 * See docs/EXPLANATION_GUIDE.md for a worked example.
 */
export function validateRoute(game, selectedSegmentIds, allSegments, segmentLinesMap, stationLinesMap, stationMap = {}) {
  if (!selectedSegmentIds || selectedSegmentIds.length === 0) {
    return { valid: false, reason: 'Route is empty.' };
  }

  // Build segment lookup map
  const segmentById = {};
  for (const s of allSegments) {
    segmentById[s.id] = s;
  }

  // Check no segment used more than once
  const seen = new Set();
  for (const id of selectedSegmentIds) {
    if (seen.has(id)) return { valid: false, reason: `Segment ${id} used more than once.` };
    seen.add(id);
  }

  // Resolve each segment id to its segment object
  const route = [];
  for (const id of selectedSegmentIds) {
    const seg = segmentById[id];
    if (!seg) return { valid: false, reason: `Segment ${id} does not exist.` };
    route.push(seg);
  }

  // Check first segment starts at assigned start station
  const startId = game.start_station_id;
  const firstSeg = route[0];
  if (firstSeg.station_a_id !== startId && firstSeg.station_b_id !== startId) {
    return { valid: false, reason: 'Route does not start at assigned start station.' };
  }

  // Walk segments: track current station and candidate lines
  let currentStationId = startId;
  let candidateLines = new Set(segmentLinesMap[firstSeg.id] || []);

  if (candidateLines.size === 0) {
    return { valid: false, reason: 'First segment is not served by any line.' };
  }

  // Move to the next station after first segment
  currentStationId = firstSeg.station_a_id === currentStationId
    ? firstSeg.station_b_id
    : firstSeg.station_a_id;

  for (let i = 1; i < route.length; i++) {
    const seg = route[i];
    const segLines = new Set(segmentLinesMap[seg.id] || []);

    // Verify segment connects to current station
    if (seg.station_a_id !== currentStationId && seg.station_b_id !== currentStationId) {
      return { valid: false, reason: `Segment ${seg.id} does not connect to previous station.` };
    }

    // Candidate lines: can continue on same line
    const continuable = new Set([...candidateLines].filter(l => segLines.has(l)));

    // Check if current station is an interchange (served by >1 line)
    const stationLines = stationLinesMap[currentStationId] || [];
    const isInterchange = stationLines.length > 1;

    let newCandidates;
    if (isInterchange) {
      // Can switch to any line serving the next segment
      newCandidates = new Set([...continuable, ...segLines]);
    } else {
      // Must stay on the same line
      newCandidates = continuable;
    }

    if (newCandidates.size === 0) {
      const stationName = stationMap[currentStationId]?.name ?? `station #${currentStationId}`;
      return { valid: false, reason: `Cannot change line at "${stationName}" — not an interchange station.` };
    }

    candidateLines = newCandidates;

    // Advance to next station
    currentStationId = seg.station_a_id === currentStationId
      ? seg.station_b_id
      : seg.station_a_id;
  }

  // Check route ends at assigned destination
  if (currentStationId !== game.destination_station_id) {
    return { valid: false, reason: 'Route does not end at assigned destination station.' };
  }

  return { valid: true, reason: null };
}
