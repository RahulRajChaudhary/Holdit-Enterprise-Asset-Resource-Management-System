const authService = require('../services/authService');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ field: 'name', message: 'Name is required.' });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ field: 'email', message: 'Entered email is invalid.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ field: 'password', message: 'Password must be at least 8 characters.' });
  }

  try {
    const user = await authService.signupEmployee({ name: name.trim(), email, password });
    res.status(201).json({ user });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(409).json({ field: 'email', message: err.message });
    }
    throw err;
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ field: 'email', message: 'Entered email is invalid.' });
  }
  if (!password) {
    return res.status(400).json({ field: 'password', message: 'Password is required.' });
  }

  try {
    const { token, user } = await authService.login({ email, password });
    res.json({ token, user });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(401).json({ field: 'password', message: err.message });
    }
    throw err;
  }
}

module.exports = { signup, login };
