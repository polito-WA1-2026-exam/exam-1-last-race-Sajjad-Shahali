const SERVER_URL = 'http://localhost:3001/api';

function handleInvalidResponse(response) {
  if (!response.ok) {
    return response.json().catch(() => {
      throw new Error(response.statusText);
    }).then(body => {
      throw new Error(body.error || response.statusText);
    });
  }
  return response;
}

// Auth
export const logIn = (credentials) =>
  fetch(`${SERVER_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials)
  }).then(handleInvalidResponse).then(r => r.json());

export const getUserInfo = () =>
  fetch(`${SERVER_URL}/sessions/current`, { credentials: 'include' })
    .then(handleInvalidResponse).then(r => r.json());

export const logOut = () =>
  fetch(`${SERVER_URL}/sessions/current`, { method: 'DELETE', credentials: 'include' })
    .then(handleInvalidResponse);

// Network
export const getInstructions = () =>
  fetch(`${SERVER_URL}/instructions`).then(handleInvalidResponse).then(r => r.json());

export const getSetupData = () =>
  fetch(`${SERVER_URL}/game/setup`, { credentials: 'include' })
    .then(handleInvalidResponse).then(r => r.json());

// Games
export const createGame = () =>
  fetch(`${SERVER_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({})
  }).then(handleInvalidResponse).then(r => r.json());

export const getGame = (gameId) =>
  fetch(`${SERVER_URL}/games/${gameId}`, { credentials: 'include' })
    .then(handleInvalidResponse).then(r => r.json());

export const saveRoute = (gameId, segments) =>
  fetch(`${SERVER_URL}/games/${gameId}/route`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ segments })
  }).then(handleInvalidResponse).then(r => r.json());

export const submitRoute = (gameId, segments) =>
  fetch(`${SERVER_URL}/games/${gameId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ segments })
  }).then(handleInvalidResponse).then(r => r.json());

export const nextExecution = (gameId) =>
  fetch(`${SERVER_URL}/games/${gameId}/execution/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({})
  }).then(handleInvalidResponse).then(r => r.json());

export const getRanking = () =>
  fetch(`${SERVER_URL}/ranking`, { credentials: 'include' })
    .then(handleInvalidResponse).then(r => r.json());
