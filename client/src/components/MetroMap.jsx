function MetroMap({ stations = [], segments = [], lines = [], lineStations = [], showLines = false, highlightIds = [], startId = null, destId = null }) {
  const stationMap = {};
  for (const s of stations) stationMap[s.id] = s;

  // Build: segmentId -> lineId for coloring lines
  // When showLines=true, we need segment colors
  // lineStations: [{line_id, station_id, position}]
  // segments: [{id, station_a_id, station_b_id}]

  // Build adjacency for line coloring: (a,b) -> [lineId]
  const segmentLineColors = {};

  if (showLines && lineStations.length > 0 && lines.length > 0) {
    // Group lineStations by line_id, sorted by position
    const byLine = {};
    for (const ls of lineStations) {
      if (!byLine[ls.line_id]) byLine[ls.line_id] = [];
      byLine[ls.line_id].push(ls);
    }
    for (const lineId in byLine) {
      byLine[lineId].sort((a, b) => a.position - b.position);
    }

    const lineMap = {};
    for (const l of lines) lineMap[l.id] = l;

    for (const lineId in byLine) {
      const stops = byLine[lineId];
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i].station_id;
        const b = stops[i + 1].station_id;
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        if (!segmentLineColors[key]) segmentLineColors[key] = [];
        segmentLineColors[key].push({ lineId: Number(lineId), color: lineMap[lineId]?.color || '#888' });
      }
    }
  }

  const W = 700, H = 620;
  const RADIUS = 9;
  const isHighlight = (id) => highlightIds.includes(id);

  return (
    <div className="metro-map-container">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 520, background: '#f8f9fa', borderRadius: 8, border: '1px solid #dee2e6' }}> 
        {/* Lines */}
        {showLines && segments.map(seg => {
          const a = stationMap[seg.station_a_id];
          const b = stationMap[seg.station_b_id];
          if (!a || !b) return null;
          const key = `${Math.min(seg.station_a_id, seg.station_b_id)}-${Math.max(seg.station_a_id, seg.station_b_id)}`;
          const lineInfos = segmentLineColors[key] || [];

          if (lineInfos.length === 0) {
            return (
              <line key={seg.id} x1={a.map_x} y1={a.map_y} x2={b.map_x} y2={b.map_y}
                stroke="#999" strokeWidth={3} strokeLinecap="round" />
            );
          }

          // Offset multiple lines slightly
          return lineInfos.map((li, idx) => {
            const offset = (idx - (lineInfos.length - 1) / 2) * 4;
            const dx = b.map_x - a.map_x;
            const dy = b.map_y - a.map_y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ox = (-dy / len) * offset;
            const oy = (dx / len) * offset;
            return (
              <line
                key={`${seg.id}-${li.lineId}`}
                x1={a.map_x + ox} y1={a.map_y + oy}
                x2={b.map_x + ox} y2={b.map_y + oy}
                stroke={li.color} strokeWidth={4} strokeLinecap="round"
              />
            );
          });
        })}

        {/* Stations */}
        {stations.map(s => {
          const isStart = s.id === startId || (startId == null && isHighlight(s.id) && s.id !== destId);
          const isDest  = s.id === destId;
          const fill   = isDest ? '#e74c3c' : isStart ? '#27ae60' : '#fff';
          const stroke = isDest ? '#c0392b' : isStart ? '#1e8449'  : '#333';
          return (
            <g key={s.id}>
              <circle
                cx={s.map_x} cy={s.map_y} r={RADIUS}
                fill={fill} stroke={stroke}
                strokeWidth={2}
              />
              <text
                x={s.map_x + 12} y={s.map_y + 4}
                fontSize={11} fill="#222"
                fontFamily="sans-serif"
                stroke="white" strokeWidth="3" paintOrder="stroke"
              >
                {s.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Line legend (setup only) */}
      {showLines && lines.length > 0 && (
        <div className="mt-2 d-flex flex-wrap gap-3">
          {lines.map(l => (
            <span key={l.id} className="d-flex align-items-center gap-1 small">
              <span style={{ display: 'inline-block', width: 24, height: 4, background: l.color, borderRadius: 2 }}></span>
              {l.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default MetroMap;
