import { Button, Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function HomePage({ loggedIn }) {
    return (
        <div className="py-4" style={{ paddingLeft: '23rem', paddingRight: '23rem' }}>

            {/* Lore intro */}
            <div className="mb-5" style={{ borderLeft: '4px solid #fda90d', paddingLeft: '1.5rem' }}>
                <p className="lead fw-semibold mb-3">
                    Years after the great wars faded into history, Westeros entered a new age of
                    peace and innovation. The engineers and master builders of the Seven Kingdoms
                    created a vast railway network connecting distant cities, castles, and ports
                    like never before. From Winterfell to King's Landing, the Iron Rails transformed
                    travel and trade across the realm.
                </p>
                <p className="lead fw-semibold mb-0">
                    Now, imagine yourself as a passenger in this new era of Westeros. Your journey
                    begins at a random station, and your destination lies somewhere across the Seven
                    Kingdoms. Study the railway map, plan your route carefully, and prepare for
                    unexpected events along the way. Every decision matters, and only the most
                    skilled travelers will reach their destination with the highest score.
                </p>
            </div>

            {/* Phase cards — 2x2 grid */}
            <h2 className="mb-3">How to Play</h2>
            <Row className="g-3 mb-5">
                <Col md={6}>
                    <Card className="h-100 border-top border-primary border-3">
                        <Card.Body>
                            <Card.Title>
                                <i className="bi bi-map me-2 text-primary" />
                                1. Setup
                            </Card.Title>
                            <Card.Text>
                                The full network map is shown with all stations, connections, and
                                coloured lines. Study the network, then click <strong>Ready</strong> when
                                you want to start.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100 border-top border-warning border-3">
                        <Card.Body>
                            <Card.Title>
                                <i className="bi bi-pencil me-2 text-warning" />
                                2. Planning
                            </Card.Title>
                            <Card.Text>
                                You get a <strong>starting station</strong> and a{' '}
                                <strong>destination</strong> at least 3 segments apart. Build your
                                route from the segment list. <strong>You have 90 seconds.</strong>{' '}
                                Each segment may be used only once. Line changes are only possible
                                at interchange stations.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100 border-top border-danger border-3">
                        <Card.Body>
                            <Card.Title>
                                <i className="bi bi-lightning me-2 text-danger" />
                                3. Execution
                            </Card.Title>
                            <Card.Text>
                                You start with <strong>20 coins</strong>. For each segment, a
                                random event applies its effect (between −4 and +4) to your total.
                                Events are revealed one at a time. An invalid route costs you all
                                20 coins.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100 border-top border-success border-3">
                        <Card.Body>
                            <Card.Title>
                                <i className="bi bi-trophy me-2 text-success" />
                                4. Result
                            </Card.Title>
                            <Card.Text>
                                Your final score is the coins remaining. Negative scores are stored
                                as zero. Your best score appears in the{' '}
                                <Link to={loggedIn ? '/ranking' : '/login'}>ranking</Link>.
                                Play as many times as you like.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Bottom banner */}
            <div className="bg-dark text-white text-center rounded py-5 px-3">
                <img src="/favicon.png" alt="Last Race" className="mb-3 d-block mx-auto" style={{ width: '72px', height: '72px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                <h1 className="fw-bold mb-4">Last Race</h1>
                {loggedIn ? (
                    <Button as={Link} to="/game" variant="success" size="lg">
                        <i className="bi bi-play-fill me-2" />
                        Play Now
                    </Button>
                ) : (
                    <Button as={Link} to="/login" variant="outline-light" size="lg">
                        <i className="bi bi-box-arrow-in-right me-2" />
                        Log in to Play
                    </Button>
                )}
            </div>

        </div>
    );
}

export default HomePage;
