import { useContext, useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import FeedbackContext from '../contexts/FeedbackContext.js';
import API from '../API.js';

function RankingPage({ user }) {
    const { setFeedbackFromError } = useContext(FeedbackContext);
    const [ranking, setRanking] = useState([]);

    useEffect(() => {
        API.getRanking()
            .then(data => setRanking(data))
            .catch(err => setFeedbackFromError(err));
    }, []);

    return (
        <div className="py-4" style={{ paddingLeft: '23rem', paddingRight: '23rem' }}>

            {/* Header banner */}
            <div className="bg-dark text-white text-center rounded py-5 px-3 mb-5">
                <i className="bi bi-trophy-fill display-4 mb-3 d-block text-warning" />
                <h1 className="fw-bold mb-2">Ranking</h1>
                <p className="lead mb-0" style={{ color: '#94a3b8' }}>
                    Best score per player across all games.
                </p>
            </div>

            {ranking.length === 0 ? (
                <p className="text-muted text-center">No games played yet.</p>
            ) : (
                <Table striped bordered hover>
                    <thead className="table-dark">
                        <tr>
                            <th style={{ width: '60px' }}>#</th>
                            <th>Player</th>
                            <th className="text-end">Best Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranking.map((entry, index) => (
                            <tr
                                key={entry.username}
                                className={entry.username === user?.username ? 'table-primary fw-bold' : ''}
                            >
                                <td>
                                    {index === 0
                                        ? <i className="bi bi-trophy-fill text-warning" />
                                        : index + 1
                                    }
                                </td>
                                <td>
                                    {entry.username}
                                    {entry.username === user?.username && (
                                        <span className="ms-2 badge bg-primary">you</span>
                                    )}
                                </td>
                                <td className="text-end">
                                    <strong>{entry.best_score}</strong>
                                    <span className="text-muted ms-1 small">coins</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

        </div>
    );
}

export default RankingPage;
