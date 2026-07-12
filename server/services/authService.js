const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const MAX_FAILED_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

async function signupEmployee({ name, email, password }) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AuthError('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'EMPLOYEE')
     RETURNING id, name, email, role, status`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

async function login({ email, password }) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new AuthError('Incorrect email or password.');
  }
  if (user.status === 'LOCKED') {
    throw new AuthError('This account is locked after too many failed attempts. Contact an admin.');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    const failedCount = user.failed_login_count + 1;
    const shouldLock = failedCount >= MAX_FAILED_ATTEMPTS;
    await pool.query(
      `UPDATE users SET failed_login_count = $1, status = $2 WHERE id = $3`,
      [failedCount, shouldLock ? 'LOCKED' : user.status, user.id]
    );
    throw new AuthError(
      shouldLock
        ? 'This account is now locked after 5 failed attempts. Contact an admin.'
        : 'Incorrect email or password.'
    );
  }

  await pool.query('UPDATE users SET failed_login_count = 0 WHERE id = $1', [user.id]);

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.department_id,
    },
  };
}

class AuthError extends Error {}

module.exports = { signupEmployee, login, AuthError };
