export function findValidStartDestination(segments, minDistance = 3) {
  // Build adjacency list: stationId -> [stationId, ...]
  const adj = {};
  for (const seg of segments) {
    if (!adj[seg.station_a_id]) adj[seg.station_a_id] = [];
    if (!adj[seg.station_b_id]) adj[seg.station_b_id] = [];
    adj[seg.station_a_id].push(seg.station_b_id);
    adj[seg.station_b_id].push(seg.station_a_id);
  }

  const stationIds = Object.keys(adj).map(Number);
  const validPairs = [];

  for (const start of stationIds) {
    const dist = bfsDistance(start, adj);
    for (const [dest, d] of Object.entries(dist)) {
      if (Number(dest) !== start && d >= minDistance) {
        validPairs.push({ start, dest: Number(dest) });
      }
    }
  }

  if (validPairs.length === 0) return null;
  // Fisher-Yates shuffle then pick first — avoids any insertion-order bias
  for (let i = validPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [validPairs[i], validPairs[j]] = [validPairs[j], validPairs[i]];
  }
  return validPairs[0];
}

function bfsDistance(startId, adj) {
  const dist = {};
  const queue = [startId];
  dist[startId] = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    for (const neighbor of (adj[current] || [])) {
      if (dist[neighbor] === undefined) {
        dist[neighbor] = dist[current] + 1;
        queue.push(neighbor);
      }
    }
  }

  return dist;
}
