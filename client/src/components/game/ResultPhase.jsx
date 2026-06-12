import { Button, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function ResultPhase({ score, validRoute, onPlayAgain }) {
    return (
        <div className="py-5 px-3 text-center">
            <Row className="justify-content-center">
                <Col md={6}>
                    {validRoute ? (
                        <>
                            <i className="bi bi-trophy-fill text-warning display-1 mb-3 d-block" />
                            <h2>Journey Complete!</h2>
                            <p className="lead text-muted">You reached the destination.</p>
                            <div className="display-1 fw-bold text-primary my-4">{score}</div>
                            <p className="fs-5 text-muted">coins remaining</p>
                        </>
                    ) : (
                        <>
                            <i className="bi bi-x-circle-fill text-danger display-1 mb-3 d-block" />
                            <h2>Invalid Route</h2>
                            <p className="lead text-muted">
                                Your route was invalid or incomplete. You lose all 20 coins.
                            </p>
                            <div className="display-1 fw-bold text-danger my-4">0</div>
                            <p className="fs-5 text-muted">coins remaining</p>
                        </>
                    )}

                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <Button variant="primary" size="lg" onClick={onPlayAgain}>
                            <i className="bi bi-arrow-repeat me-2" />
                            Play Again
                        </Button>
                        <Button as={Link} to="/ranking" variant="outline-secondary" size="lg">
                            <i className="bi bi-trophy me-2" />
                            Ranking
                        </Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default ResultPhase;
