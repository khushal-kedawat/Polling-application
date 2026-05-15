const PREFIX = 'pollit.respondent.';

const random = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export function getRespondentToken(slug) {
  const key = PREFIX + slug;
  let token = localStorage.getItem(key);
  if (!token) {
    token = random();
    localStorage.setItem(key, token);
  }
  return token;
}

export function markSubmitted(slug) {
  localStorage.setItem(PREFIX + slug + '.submitted', '1');
}

export function hasSubmitted(slug) {
  return localStorage.getItem(PREFIX + slug + '.submitted') === '1';
}
