import { Button, Col, Row } from 'react-bootstrap';
import NetworkMap from './NetworkMap.jsx';

function SetupPhase({ network, onReady }) {
    return (
        <div className="py-4 px-3">
            <Row className="align-items-center g-0">
                <Col md={7}>
                    <div style={{ maxWidth: '1200px' }}>
                        <NetworkMap network={network} showLines={true} />
                    </div>
                </Col>
                <Col md={5} className="ps-5">
                    <h2 className="mb-3">Setup Phase</h2>
                    <p className="text-muted mb-3">
                        Study the <strong>Westeros Rail Network</strong> carefully.
                        Memorize the lines, stations, and connections.
                        The full map disappears once planning begins.
                    </p>
                    <p className="text-muted mb-4">
                        You will have <strong>90 seconds</strong> to reconstruct
                        your route from memory.
                    </p>
                    <Button
                        variant="success"
                        size="lg"
                        onClick={onReady}
                        disabled={network.length === 0}
                    >
                        <i className="bi bi-play-fill me-2" />
                        Ready, Start Planning
                    </Button>
                </Col>
            </Row>
        </div>
    );
}

export default SetupPhase;
