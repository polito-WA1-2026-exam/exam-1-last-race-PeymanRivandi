import { Button, Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function HomePage({ loggedIn }) {
    return (
        <div className="py-4 px-3">
            <Row className="mb-4">
                <Col>
                    <h1>
                        <i className="bi bi-train-front me-2" />
                        Last Race
                    </h1>
                    <p className="lead">
                        A single-player underground metro game. You are assigned a starting station
                        and a destination. Plan your route, survive random events, and reach the
                        destination with as many coins as possible.
                    </p>
                    {loggedIn ? (
                        <Button as={Link} to="/game" variant="primary" size="lg">
                            <i className="bi bi-play-fill me-2" />
                            Play
                        </Button>
                    ) : (
                        <p className="text-muted">
                            <Link to="/login">Log in</Link> to start playing.
                        </p>
                    )}
                </Col>
            </Row>

            <h2 className="mb-3">How to play</h2>
            <Row className="g-3">
                <Col md={6} lg={3}>
                    <Card className="h-100">
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
                <Col md={6} lg={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>
                                <i className="bi bi-pencil me-2 text-warning" />
                                2. Planning
                            </Card.Title>
                            <Card.Text>
                                You are given a <strong>starting station</strong> and a{' '}
                                <strong>destination</strong> (at least 3 segments apart). The map now
                                shows only station names, without the lines. Build your route by selecting
                                segments from the list. <strong>You have 90 seconds.</strong> Each
                                segment may be used only once. Line changes are only possible at
                                interchange stations.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>
                                <i className="bi bi-lightning me-2 text-danger" />
                                3. Execution
                            </Card.Title>
                            <Card.Text>
                                You start with <strong>20 coins</strong>. For each segment of your
                                route, a random event occurs and its effect (between −4 and +4) is
                                applied to your total. Events are revealed one at a time. If your
                                route is invalid or incomplete, you lose all 20 coins.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>
                                <i className="bi bi-trophy me-2 text-success" />
                                4. Result
                            </Card.Title>
                            <Card.Text>
                                Your final score is the number of coins remaining. Negative scores
                                are saved as zero. Your best score across all games appears in the{' '}
                                <Link to={loggedIn ? '/ranking' : '/login'}>ranking</Link>.
                                You can play as many times as you like.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default HomePage;
