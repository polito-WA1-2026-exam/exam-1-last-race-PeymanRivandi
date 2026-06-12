import { Button } from 'react-bootstrap';
import NetworkMap from './NetworkMap.jsx';

function SetupPhase({ network, onReady }) {
    return (
        <div className="py-4 px-3">
            <h2>Setup — Network Map</h2>
            <p className="text-muted mb-3">
                Study the network carefully. When you are ready, click <strong>Ready</strong> to
                start the 90-second planning phase.
            </p>

            <NetworkMap network={network} showLines={true} />

            <Button
                variant="success"
                size="lg"
                className="mt-4"
                onClick={onReady}
                disabled={network.length === 0}
            >
                <i className="bi bi-play-fill me-2" />
                Ready — Start Planning
            </Button>
        </div>
    );
}

export default SetupPhase;
