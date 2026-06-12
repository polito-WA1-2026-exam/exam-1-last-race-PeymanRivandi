import { Button, Col, ListGroup, ProgressBar, Row } from 'react-bootstrap';
import NetworkMap from './NetworkMap.jsx';

function PlanningPhase({ network, segments, start, destination, route, timeLeft, stationMap, onSegmentClick, onRemoveLast, onSubmit }) {

    // Derive the set of already-used segment keys from the current route
    const usedKeys = new Set();
    for (let i = 0; i < route.length - 1; i++) {
        const key = `${Math.min(route[i], route[i + 1])}-${Math.max(route[i], route[i + 1])}`;
        usedKeys.add(key);
    }

    // The station the next selected segment must connect to
    const lastId = route.length > 0 ? route[route.length - 1] : start.id;

    const routeComplete = route.length > 0 && route[route.length - 1] === destination.id;

    const timerVariant = timeLeft > 30 ? 'success' : timeLeft > 10 ? 'warning' : 'danger';

    // Sort segments alphabetically so the player can scan the list more easily
    const sortedSegments = [...segments].sort((a, b) => a.from_name.localeCompare(b.from_name));

    return (
        <div className="py-4 px-3">
            {/* Header row: assignment + timer */}
            <Row className="mb-3 align-items-center">
                <Col>
                    <h2>Planning</h2>
                    <p className="mb-0">
                        From <strong className="text-primary">{start.name}</strong>{' '}
                        to <strong className="text-success">{destination.name}</strong>
                    </p>
                </Col>
                <Col xs="auto" className="text-end">
                    <div
                        className="fs-2 fw-bold mb-1"
                        style={{ color: timeLeft <= 10 ? '#dc3545' : 'inherit' }}
                    >
                        {timeLeft}s
                    </div>
                    <ProgressBar variant={timerVariant} now={timeLeft} max={90} style={{ width: '120px' }} />
                </Col>
            </Row>

            <Row>
                {/* Left column: map (stations only, no lines) + current route */}
                <Col md={4} className="mb-3">
                    <NetworkMap
                        network={network}
                        showLines={false}
                        startId={start.id}
                        destId={destination.id}
                        stationMap={stationMap}
                    />
                    <p className="text-muted small mt-2">
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} className="me-1" />
                        start &nbsp;
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} className="me-1" />
                        destination
                    </p>

                    <h5 className="mt-3">Your Route</h5>
                    {route.length === 0 ? (
                        <p className="text-muted small">
                            No segments selected yet. Pick one that includes{' '}
                            <strong>{start.name}</strong>.
                        </p>
                    ) : (
                        <p className="small">
                            {route.map(id => stationMap[id]).join(' → ')}
                        </p>
                    )}

                    {routeComplete && (
                        <p className="text-success small fw-bold">
                            <i className="bi bi-check-circle me-1" />
                            Route reaches destination!
                        </p>
                    )}

                    <div className="d-flex gap-2 mt-2">
                        {route.length > 0 && (
                            <Button variant="outline-secondary" size="sm" onClick={onRemoveLast}>
                                <i className="bi bi-arrow-counterclockwise me-1" />
                                Undo
                            </Button>
                        )}
                        <Button variant="primary" size="sm" onClick={onSubmit}>
                            Submit Route
                        </Button>
                    </div>
                </Col>

                {/* Right column: segment list */}
                <Col md={8}>
                    <h5>
                        Segments{' '}
                        <span className="text-muted fw-normal fs-6">
                            ({usedKeys.size} / {segments.length} used)
                        </span>
                    </h5>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <ListGroup>
                            {sortedSegments.map(seg => {
                                const key = `${Math.min(seg.from_id, seg.to_id)}-${Math.max(seg.from_id, seg.to_id)}`;
                                const isUsed = usedKeys.has(key);
                                const isConnectable = seg.from_id === lastId || seg.to_id === lastId;
                                const isClickable = !isUsed && isConnectable;

                                return (
                                    <ListGroup.Item
                                        key={key}
                                        action={isClickable}
                                        onClick={() => isClickable && onSegmentClick(seg)}
                                        variant={isUsed ? 'success' : ''}
                                        className="d-flex justify-content-between align-items-center"
                                        style={{ cursor: isClickable ? 'pointer' : 'default', opacity: !isUsed && !isConnectable ? 0.45 : 1 }}
                                    >
                                        <span>{seg.from_name} — {seg.to_name}</span>
                                        {isUsed && <i className="bi bi-check2 text-success" />}
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default PlanningPhase;
