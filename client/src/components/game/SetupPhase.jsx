import { Fragment } from 'react';
import { Button } from 'react-bootstrap';

function SetupPhase({ network, onReady }) {
    return (
        <div className="py-4 px-3">
            <h2>Setup — Network Map</h2>
            <p className="text-muted mb-4">
                Study the network carefully. When you are ready, click <strong>Ready</strong> to
                start the 90-second planning phase.
            </p>

            <div className="mb-4">
                {network.map(line => (
                    <div
                        key={line.id}
                        className="mb-3 p-3 rounded bg-light"
                        style={{ borderLeft: `5px solid ${line.hex_color}` }}
                    >
                        <strong style={{ color: line.hex_color }}>{line.name}</strong>
                        <div className="d-flex flex-wrap align-items-center gap-1 mt-2">
                            {line.stations.map((station, idx) => (
                                <Fragment key={station.id}>
                                    <span
                                        className="badge rounded-pill px-3 py-2"
                                        style={{ backgroundColor: line.hex_color, fontSize: '0.85rem' }}
                                    >
                                        {station.name}
                                    </span>
                                    {idx < line.stations.length - 1 && (
                                        <span style={{ color: line.hex_color, fontWeight: 'bold', fontSize: '1.2rem' }}>
                                            —
                                        </span>
                                    )}
                                </Fragment>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Button variant="success" size="lg" onClick={onReady} disabled={network.length === 0}>
                <i className="bi bi-play-fill me-2" />
                Ready — Start Planning
            </Button>
        </div>
    );
}

export default SetupPhase;
