import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { useEffect, useState } from 'react';
import { Container, Toast, ToastBody } from 'react-bootstrap';
import { Routes, Route, Navigate } from 'react-router-dom';

import FeedbackContext from './contexts/FeedbackContext.js';
import API from './API.js';
import HomePage from './components/HomePage.jsx';
import LoginPage from './components/LoginPage.jsx';
import GamePage from './components/GamePage.jsx';
import RankingPage from './components/RankingPage.jsx';

function App() {
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [feedback, setFeedback] = useState('');

    const setFeedbackFromError = (err) => {
        const message = err.message || 'Unknown error';
        setFeedback(message);
    };

    // On first mount, check if a session already exists (e.g. page reload)
    useEffect(() => {
        API.getUserInfo()
            .then(user => {
                setLoggedIn(true);
                setUser(user);
            })
            .catch(e => {
                if (loggedIn) setFeedbackFromError(e);
                setLoggedIn(false);
                setUser(null);
            });
    }, []);

    const handleLogin = async (credentials) => {
        const user = await API.logIn(credentials);
        setUser(user);
        setLoggedIn(true);
        setFeedback('Welcome, ' + user.username);
    };

    const handleLogout = async () => {
        await API.logOut();
        setLoggedIn(false);
        setUser(null);
    };

    return (
        <FeedbackContext.Provider value={{ setFeedback, setFeedbackFromError }}>
            <div className="min-vh-100 d-flex flex-column">
                <Container fluid className="flex-grow-1 d-flex flex-column">
                    <Routes>
                        <Route path="/" element={
                            <HomePage loggedIn={loggedIn} user={user} />
                        } />
                        <Route path="/login" element={
                            loggedIn
                                ? <Navigate replace to="/" />
                                : <LoginPage login={handleLogin} />
                        } />
                        <Route path="/game" element={
                            !loggedIn
                                ? <Navigate replace to="/login" />
                                : <GamePage user={user} />
                        } />
                        <Route path="/ranking" element={
                            !loggedIn
                                ? <Navigate replace to="/login" />
                                : <RankingPage />
                        } />
                        <Route path="*" element={<Navigate replace to="/" />} />
                    </Routes>
                </Container>

                <Toast
                    show={feedback !== ''}
                    autohide
                    onClose={() => setFeedback('')}
                    delay={4000}
                    position="top-end"
                    className="position-fixed end-0 m-3"
                >
                    <ToastBody>{feedback}</ToastBody>
                </Toast>
            </div>
        </FeedbackContext.Provider>
    );
}

export default App;
