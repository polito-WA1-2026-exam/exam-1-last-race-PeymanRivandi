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

    // Sort: used (green) first, then connectable (blue), then non-connectable; alphabetical within each group
    const sortedSegments = [...segments].sort((a, b) => {
        const keyA = `${Math.min(a.from_id, a.to_id)}-${Math.max(a.from_id, a.to_id)}`;
        const keyB = `${Math.min(b.from_id, b.to_id)}-${Math.max(b.from_id, b.to_id)}`;
        const priorityA = usedKeys.has(keyA) ? 0 : (a.from_id === lastId || a.to_id === lastId) ? 1 : 2;
        const priorityB = usedKeys.has(keyB) ? 0 : (b.from_id === lastId || b.to_id === lastId) ? 1 : 2;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.from_name.localeCompare(b.from_name);
    });

    return (
        <div className="py-4 px-3">
            {/* Header: phase title with inline countdown */}
            <h2 className="mb-2">
                Planning Phase{' '}
                <span style={{ color: timeLeft <= 10 ? '#dc3545' : 'inherit' }}>
                    ({timeLeft}s)
                </span>
            </h2>
            {/* Full-width timer bar */}
            <ProgressBar variant={timerVariant} now={timeLeft} max={90} className="mb-3" style={{ height: '14px' }} />

            <Row className="align-items-stretch">
                {/* Left column: map + route info */}
                <Col md={5} className="d-flex flex-column mb-3">
                    <NetworkMap
                        network={network}
                        showLines={false}
                        startId={start.id}
                        destId={destination.id}
                        stationMap={stationMap}
                    />
                    <p className="text-muted small mt-2 mb-1">
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} className="me-1" />
                        start &nbsp;
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} className="me-1" />
                        destination
                    </p>
                    <p className="fw-bold fs-5 mb-3">
                        From <span className="text-success">{start.name}</span>{' '}
                        to <span className="text-danger">{destination.name}</span>
                    </p>

                    <h5 className="mt-1">Your Route</h5>
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
                        <Button variant="primary" size="lg" onClick={onSubmit}>
                            Submit Route
                        </Button>
                    </div>
                </Col>

                {/* Right column: segment list — no inner scroll, all items visible */}
                <Col md={7}>
                    <h5>
                        Segments{' '}
                        <span className="text-muted fw-normal fs-6">
                            ({usedKeys.size} / {segments.length} used)
                        </span>
                    </h5>
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
                                    variant={isConnectable && !isUsed ? 'primary' : isUsed ? 'success' : ''}
                                    className="d-flex justify-content-between align-items-center"
                                    style={{ cursor: isClickable ? 'pointer' : 'default', opacity: !isUsed && !isConnectable ? 0.4 : 1 }}
                                >
                                    <span>{seg.from_name} — {seg.to_name}</span>
                                    {isUsed && <i className="bi bi-check2 text-success" />}
                                    {isConnectable && !isUsed && <i className="bi bi-arrow-right-circle text-primary" />}
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                </Col>
            </Row>
        </div>
    );
}

export default PlanningPhase;
