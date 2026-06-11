const SERVER_URL = 'http://localhost:3001';

async function logIn(credentials) {
    const response = await fetch(`${SERVER_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });
    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.json();
        throw err;
    }
}

async function logOut() {
    await fetch(`${SERVER_URL}/api/sessions/current`, {
        method: 'DELETE',
        credentials: 'include',
    });
}

async function getUserInfo() {
    const response = await fetch(`${SERVER_URL}/api/sessions/current`, {
        credentials: 'include',
    });
    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.json();
        throw err;
    }
}

async function getNetwork() {
    const response = await fetch(`${SERVER_URL}/api/network`, {
        credentials: 'include',
    });
    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.json();
        throw err;
    }
}

async function getSegments() {
    const response = await fetch(`${SERVER_URL}/api/segments`, {
        credentials: 'include',
    });
    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.json();
        throw err;
    }
}

async function startGame() {
    const response = await fetch(`${SERVER_URL}/api/game/start`, {
        method: 'POST',
        credentials: 'include',
    });
    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.json();
        throw err;
    }
}

async function submitGame(route) {
    const response = await fetch(`${SERVER_URL}/api/game/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ route }),
    });
    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.json();
        throw err;
    }
}

async function getRanking() {
    const response = await fetch(`${SERVER_URL}/api/ranking`, {
        credentials: 'include',
    });
    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.json();
        throw err;
    }
}

const API = { logIn, logOut, getUserInfo, getNetwork, getSegments, startGame, submitGame, getRanking };
export default API;
