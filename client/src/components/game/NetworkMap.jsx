import { Fragment } from 'react';

// Fixed (x,y) positions for each station — matched to the Westeros Rail Network map.
// ViewBox is 0 0 1000 750. These were set by looking at the reference image.
const POSITIONS = {
    'Winterfell':      { x: 500, y:  70 },
    'Greywater Watch': { x: 515, y: 185 },
    'The Twins':       { x: 530, y: 270 },
    'Riverrun':        { x: 415, y: 340 },
    "King's Landing":  { x: 605, y: 380 },
    'Dragonstone':     { x: 830, y: 360 },
    'Gultown':         { x: 875, y: 300 },
    'White Harbor':    { x: 720, y: 120 },
    'The Eyrie':       { x: 685, y: 270 },
    'Pyke':            { x: 335, y: 315 },
    'Lannisport':      { x: 365, y: 400 },
    'Highgarden':      { x: 465, y: 505 },
    'Oldtown':         { x: 360, y: 580 },
    'Starfall':        { x: 515, y: 650 },
    'Sunspear':        { x: 700, y: 615 },
    "Storm's End":     { x: 680, y: 505 },
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
                    const fill    = isStart ? '#3b82f6' : isDest ? '#22c55e' : '#ffffff';
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
                                fill={isStart ? '#93c5fd' : isDest ? '#86efac' : '#e2e8f0'}
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
                <div className="d-flex flex-wrap gap-3 mt-2 px-1">
                    {network.map(line => (
                        <span key={line.id} className="d-flex align-items-center gap-1 small">
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: 28, height: 4,
                                    backgroundColor: line.hex_color,
                                    borderRadius: 2,
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
