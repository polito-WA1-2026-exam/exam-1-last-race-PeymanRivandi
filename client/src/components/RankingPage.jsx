import { useContext, useEffect, useState } from 'react';
import { Col, Row, Table } from 'react-bootstrap';
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
        <div className="py-4 px-3">
            <Row className="mb-4">
                <Col>
                    <h2>
                        <i className="bi bi-trophy me-2 text-warning" />
                        Ranking
                    </h2>
                    <p className="text-muted">Best score per player across all games.</p>
                </Col>
            </Row>

            <Row className="justify-content-center">
                <Col md={6}>
                    {ranking.length === 0 ? (
                        <p className="text-muted">No games played yet.</p>
                    ) : (
                        <Table striped bordered hover>
                            <thead className="table-dark">
                                <tr>
                                    <th>#</th>
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
                                        <td>{index + 1}</td>
                                        <td>
                                            {entry.username}
                                            {entry.username === user?.username && (
                                                <span className="ms-2 badge bg-primary">you</span>
                                            )}
                                        </td>
                                        <td className="text-end">{entry.best_score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Col>
            </Row>
        </div>
    );
}

export default RankingPage;
