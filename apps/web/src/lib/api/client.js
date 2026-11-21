// The access token lives only in memory (15 min). The refresh token is an
// httpOnly cookie the page cannot read; a localStorage flag only says whether
// trying a refresh is worth it, so signed-out visitors make no failing request.
let accessToken = null;
/** The session sets and clears the token; nothing else should. */
export const setAccessToken = (token) => (accessToken = token);
const FLAG = 'pirento.session';
export const flag = (on) => {
  try {
    if (on) localStorage.setItem(FLAG, '1');
    else localStorage.removeItem(FLAG);
  } catch {
    /* storage blocked: the session just lasts until reload */
  }
};
export const hasFlag = () => {
  try {
    return localStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
};

let refreshing = null;
export async function refresh() {
  // One refresh for many parallel 401s: the old cookie is single-use.
  refreshing ??= fetch('/api/auth/refresh', {method: 'POST'})
    .then(async (res) => {
      if (!res.ok) throw new Error('signed out');
      const {data} = await res.json();
      accessToken = data.token;
      return data.user;
    })
    .finally(() => (refreshing = null));
  return refreshing;
}

// On these a 401 means a wrong password or a dead cookie, not an expired token, so they never retry.
const NO_RETRY = ['/api/auth/refresh', '/api/auth/password/login', '/api/auth/staff/login', '/api/auth/google'];

/** fetch with the access token, refreshing once on 401. */
export async function authFetch(url, init = {}) {
  const send = () =>
    fetch(url, {
      ...init,
      headers: {...init.headers, ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {})},
    });
  let res = await send();
  if (res.status === 401 && !NO_RETRY.includes(url) && hasFlag()) {
    try {
      await refresh();
      res = await send();
    } catch {
      flag(false);
    }
  }
  return res;
}

export async function api(path, {method = 'GET', body} = {}) {
  const res = await authFetch(`/api${path}`, {
    method,
    headers: body ? {'Content-Type': 'application/json'} : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // The gateway's rate limit answers in plain text, so name it here.
    const fallback =
      res.status === 429 ? 'Too many requests. Wait a minute and try again.' : 'Could not reach Pirento. Try again.';
    // The code lets a page react to a known case (e.g. NO_ACCOUNT → offer sign-up).
    throw Object.assign(new Error(json.error?.message ?? fallback), {code: json.error?.code, status: res.status});
  }
  return json.data;
}

// Small fetch hook: {data, error, loading, reload}.
