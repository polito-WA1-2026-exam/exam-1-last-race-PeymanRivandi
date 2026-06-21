import { useState } from 'react';
import { Button, Card, Col, Row } from 'react-bootstrap';

function ExecutionPhase({ events, stationMap, onDone }) {
    const [index, setIndex] = useState(0);

    const event = events[index];
    const isLast = index === events.length - 1;

    return (
        <div className="py-4 px-3">
            <h2>Execution</h2>
            <p className="text-muted">
                Step {index + 1} of {events.length}
            </p>

            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="text-muted small">
                            <i className="bi bi-arrow-right me-1" />
                            {stationMap[event.from_id]} → {stationMap[event.to_id]}
                        </Card.Header>
                        <Card.Body className="text-center py-4">
                            <p className="lead mb-3">{event.description}</p>
                            <div
                                className="display-4 fw-bold mb-2"
                                style={{ color: event.effect >= 0 ? '#198754' : '#dc3545' }}
                            >
                                {event.effect > 0 ? '+' : ''}{event.effect}
                            </div>
                            <p className="text-muted">coins this segment</p>
                            <hr />
                            <p className="fs-5 mb-0">
                                Total: <strong>{event.coins_after}</strong> coins
                            </p>
                        </Card.Body>
                    </Card>

                    {isLast ? (
                        <Button variant="primary" size="lg" className="w-100" onClick={onDone}>
                            <i className="bi bi-flag-fill me-2" />
                            See Final Result
                        </Button>
                    ) : (
                        <Button variant="secondary" size="lg" className="w-100" onClick={() => setIndex(i => i + 1)}>
                            Next Segment
                            <i className="bi bi-arrow-right ms-2" />
                        </Button>
                    )}
                </Col>
            </Row>
        </div>
    );
}

export default ExecutionPhase;
