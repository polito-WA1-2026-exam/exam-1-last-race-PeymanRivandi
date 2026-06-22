import { Fragment } from 'react';

// Fixed (x,y) positions for each station — matched to the Westeros Rail Network map.
// ViewBox is 0 0 1000 750. These were set by looking at the reference image.
const POSITIONS = {
    'Winterfell':      { x: 380, y:  70 },
    'Greywater Watch': { x: 360, y: 185 },
    'The Twins':       { x: 350, y: 270 },
    'Riverrun':        { x: 330, y: 340 },
    "King's Landing":  { x: 500, y: 380 },
    'Dragonstone':     { x: 750, y: 380 },
    'Gultown':         { x: 800, y: 290 },
    'White Harbor':    { x: 600, y: 120 },
    'The Eyrie':       { x: 580, y: 240 },
    'Pyke':            { x: 110, y: 280 },
    'Lannisport':      { x: 130, y: 400 },
    'Highgarden':      { x: 280, y: 505 },
    'Oldtown':         { x: 200, y: 600 },
    'Starfall':        { x: 450, y: 680 },
    'Sunspear':        { x: 650, y: 615 },
    "Storm's End":     { x: 620, y: 505 },
};

// Text anchor and offset for each label so they don't overlap the circle or each other
const LABEL_OFFSETS = {
    'Winterfell':      { dx:   0, dy: -16, anchor: 'middle' },
    'Greywater Watch': { dx:  16, dy:   4, anchor: 'start'  },
    'The Twins':       { dx:  16, dy:   4, anchor: 'start'  },
    'Riverrun':        { dx: -14, dy:   4, anchor: 'end'    },
    "King's Landing":  { dx:   0, dy:  18, anchor: 'middle' },
    'Dragonstone':     { dx:  14, dy:   4, anchor: 'start'  },
    'Gultown':         { dx:  14, dy:   4, anchor: 'start'  },
    'White Harbor':    { dx:  14, dy:  -8, anchor: 'start'  },
    'The Eyrie':       { dx:  14, dy:   4, anchor: 'start'  },
    'Pyke':            { dx: -14, dy:   4, anchor: 'end'    },
    'Lannisport':      { dx: -14, dy:   4, anchor: 'end'    },
    'Highgarden':      { dx:   0, dy:  18, anchor: 'middle' },
    'Oldtown':         { dx: -14, dy:   4, anchor: 'end'    },
    'Starfall':        { dx:   0, dy:  18, anchor: 'middle' },
    'Sunspear':        { dx:  14, dy:   4, anchor: 'start'  },
    "Storm's End":     { dx:  14, dy:   4, anchor: 'start'  },
};

// showLines  — true in Setup phase (full map), false in Planning phase (dots only)
// startId    — optional: station id to highlight as start (blue)
// destId     — optional: station id to highlight as destination (green)
// stationMap — optional: { id: name } used to resolve startId / destId to names
function NetworkMap({ network, showLines, startId, destId, stationMap }) {

    // Build segments list from line data when showLines is true
    const segments = [];
    if (showLines) {
        for (const line of network) {
            for (let i = 0; i < line.stations.length - 1; i++) {
                const from = POSITIONS[line.stations[i].name];
                const to   = POSITIONS[line.stations[i + 1].name];
                if (from && to) {
                    segments.push({
                        key:   `${line.id}-${i}`,
                        x1: from.x, y1: from.y,
                        x2: to.x,   y2: to.y,
                        color: line.hex_color,
                    });
                }
            }
        }
    }

    // Collect unique stations
    const seen = new Set();
    const stations = [];
    for (const line of network) {
        for (const s of line.stations) {
            if (!seen.has(s.name) && POSITIONS[s.name]) {
                seen.add(s.name);
                stations.push({ id: s.id, name: s.name, ...POSITIONS[s.name] });
            }
        }
    }

    const startName = stationMap && startId ? stationMap[startId] : null;
    const destName  = stationMap && destId  ? stationMap[destId]  : null;

    return (
        <div>
            <svg
                viewBox="0 0 1000 750"
                style={{ width: '100%', background: '#1e293b', borderRadius: '8px', display: 'block' }}
                aria-label="Westeros Rail Network map"
            >
                {/* Line segments — drawn first so station dots sit on top */}
                {segments.map(seg => (
                    <line
                        key={seg.key}
                        x1={seg.x1} y1={seg.y1}
                        x2={seg.x2} y2={seg.y2}
                        stroke={seg.color}
                        strokeWidth={5}
                        strokeLinecap="round"
                    />
                ))}

                {/* Station circles + labels */}
                {stations.map(station => {
                    const off    = LABEL_OFFSETS[station.name] || { dx: 0, dy: -16, anchor: 'middle' };
                    const isStart = station.name === startName;
                    const isDest  = station.name === destName;
                    const fill    = isStart ? '#22c55e' : isDest ? '#ef4444' : '#ffffff';
                    const r       = isStart || isDest ? 9 : 7;

                    return (
                        <Fragment key={station.name}>
                            <circle
                                cx={station.x} cy={station.y} r={r}
                                fill={fill}
                                stroke="#1e293b"
                                strokeWidth={2}
                            />
                            <text
                                x={station.x + off.dx}
                                y={station.y + off.dy}
                                textAnchor={off.anchor}
                                fill={isStart ? '#86efac' : isDest ? '#fca5a5' : '#e2e8f0'}
                                fontSize={12}
                                fontFamily="sans-serif"
                            >
                                {station.name}
                            </text>
                        </Fragment>
                    );
                })}
            </svg>

            {/* Legend — only shown with full map (Setup phase) */}
            {showLines && (
                <div className="d-flex flex-wrap gap-4 mt-3 px-1">
                    {network.map(line => (
                        <span key={line.id} className="d-flex align-items-center gap-2 fw-semibold fs-6">
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: 36, height: 6,
                                    backgroundColor: line.hex_color,
                                    borderRadius: 3,
                                    border: line.hex_color === '#ffffff' ? '1px solid #888' : 'none',
                                }}
                            />
                            {line.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NetworkMap;
