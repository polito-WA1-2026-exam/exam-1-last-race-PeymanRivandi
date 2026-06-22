import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function NavBar({ loggedIn, user, onLogout }) {
    const navigate = useNavigate();

    return (
        <Navbar bg="dark" variant="dark" expand="sm">
            <Container fluid>
                <Navbar.Brand as={Link} to="/">
                    <img src="/favicon.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} className="me-2" />
                    Last Race
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-nav" />
                <Navbar.Collapse id="main-nav">
                    <Nav className="me-auto">
                        {loggedIn && (
                            <Nav.Link as={Link} to="/ranking">
                                <i className="bi bi-trophy me-1" />
                                Ranking
                            </Nav.Link>
                        )}
                    </Nav>
                    <Nav className="align-items-center gap-2">
                        {loggedIn ? (
                            <>
                                <Navbar.Text>{user?.username}</Navbar.Text>
                                <Button variant="outline-light" size="sm" onClick={onLogout}>
                                    <i className="bi bi-box-arrow-right me-1" />
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline-light" size="sm" onClick={() => navigate('/login')}>
                                <i className="bi bi-box-arrow-in-right me-1" />
                                Login
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavBar;
