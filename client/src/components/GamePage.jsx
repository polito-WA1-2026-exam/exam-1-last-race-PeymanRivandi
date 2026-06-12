import { useContext, useEffect, useRef, useState } from 'react';
import FeedbackContext from '../contexts/FeedbackContext.js';
import API from '../API.js';
import SetupPhase from './game/SetupPhase.jsx';
import PlanningPhase from './game/PlanningPhase.jsx';
import ExecutionPhase from './game/ExecutionPhase.jsx';
import ResultPhase from './game/ResultPhase.jsx';

function GamePage() {
    const { setFeedbackFromError } = useContext(FeedbackContext);

    const [phase, setPhase] = useState('setup');         // 'setup' | 'planning' | 'execution' | 'result'
    const [network, setNetwork] = useState([]);           // full network with lines + ordered stations
    const [segments, setSegments] = useState([]);         // all adjacent pairs, no line info
    const [start, setStart] = useState(null);             // { id, name }
    const [destination, setDestination] = useState(null); // { id, name }
    const [route, setRoute] = useState([]);               // [stationId, stationId, ...]
    const [timeLeft, setTimeLeft] = useState(90);
    const [events, setEvents] = useState([]);             // event objects from server
    const [score, setScore] = useState(0);
    const [validRoute, setValidRoute] = useState(false);

    // Ref to prevent double-submission (timer fires + user clicks submit simultaneously)
    const submittedRef = useRef(false);

    // Build { stationId: stationName } from the network data already in state
    const stationMap = {};
    for (const line of network) {
        for (const station of line.stations) {
            stationMap[station.id] = station.name;
        }
    }

    // Fetch the full network once on mount — used in Setup and Planning phases
    useEffect(() => {
        API.getNetwork()
            .then(data => setNetwork(data))
            .catch(err => setFeedbackFromError(err));
    }, []);

    // Countdown timer — runs only during planning phase, one tick per second
    useEffect(() => {
        if (phase !== 'planning' || timeLeft <= 0) return;
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer); // cancel pending tick if phase changes or component unmounts
    }, [phase, timeLeft]);

    // Auto-submit when timer reaches zero
    useEffect(() => {
        if (phase === 'planning' && timeLeft === 0) {
            handleSubmit();
        }
    }, [timeLeft, phase]);

    // Called when player clicks "Ready" in Setup phase
    const handleReady = async () => {
        try {
            const [segs, game] = await Promise.all([
                API.getSegments(),
                API.startGame(),
            ]);
            setSegments(segs);
            setStart(game.start);
            setDestination(game.destination);
            setRoute([]);
            setTimeLeft(90);
            submittedRef.current = false;
            setPhase('planning');
        } catch (err) {
            setFeedbackFromError(err);
        }
    };

    // Called when player clicks a segment in the segment list
    const handleSegmentClick = (seg) => {
        const lastId = route.length > 0 ? route[route.length - 1] : start.id;
        if (seg.from_id !== lastId && seg.to_id !== lastId) return; // not connectable — ignore
        const nextId = seg.from_id === lastId ? seg.to_id : seg.from_id;
        // If route is empty, also add the starting station as the first element
        setRoute(prev => prev.length === 0 ? [lastId, nextId] : [...prev, nextId]);
    };

    // Remove the last segment from the route (undo)
    const handleRemoveLast = () => {
        // If only one segment selected [A, B], remove it entirely → []
        setRoute(prev => prev.length <= 2 ? [] : prev.slice(0, -1));
    };

    // Submit the route to the server
    const handleSubmit = async () => {
        if (submittedRef.current) return; // prevent double-submission
        submittedRef.current = true;

        try {
            const result = await API.submitGame(route);
            setEvents(result.events);
            setScore(result.score);
            setValidRoute(result.valid);
            // If valid and has events, show Execution phase; otherwise skip to Result
            if (result.valid && result.events.length > 0) {
                setPhase('execution');
            } else {
                setPhase('result');
            }
        } catch (err) {
            setFeedbackFromError(err);
            submittedRef.current = false; // allow retry if it was a network error
        }
    };

    // Reset everything and go back to Setup for a new game
    const handlePlayAgain = () => {
        setRoute([]);
        setEvents([]);
        setScore(0);
        setValidRoute(false);
        setTimeLeft(90);
        submittedRef.current = false;
        setPhase('setup');
    };

    if (phase === 'setup')
        return <SetupPhase network={network} onReady={handleReady} />;

    if (phase === 'planning')
        return (
            <PlanningPhase
                network={network}
                segments={segments}
                start={start}
                destination={destination}
                route={route}
                timeLeft={timeLeft}
                stationMap={stationMap}
                onSegmentClick={handleSegmentClick}
                onRemoveLast={handleRemoveLast}
                onSubmit={handleSubmit}
            />
        );

    if (phase === 'execution')
        return (
            <ExecutionPhase
                events={events}
                stationMap={stationMap}
                onDone={() => setPhase('result')}
            />
        );

    return (
        <ResultPhase
            score={score}
            validRoute={validRoute}
            onPlayAgain={handlePlayAgain}
        />
    );
}

export default GamePage;
