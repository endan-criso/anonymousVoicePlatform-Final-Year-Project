/**
 * VoiceLink Auth — auth.js
 * Handles login and registration for index.html
 */

const API_BASE = 'http://localhost:8080/api';
let selectedRole = null;

// ── Role Selection ────────────────────────────────────────────────────────────
function selectRole(el, role) {
  selectedRole = role;
  document.getElementById('selectedRoleInput').value = role;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

// ── Form Toggle ───────────────────────────────────────────────────────────────
function showLogin() {
  document.getElementById('loginForm').style.display    = 'block';
  document.getElementById('registerForm').style.display = 'none';
  clearMessage();
  selectedRole = null;
  document.getElementById('selectedRoleInput').value = '';
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
}

function showRegister() {
  document.getElementById('loginForm').style.display    = 'none';
  document.getElementById('registerForm').style.display = 'block';
  clearMessage();
}

// ── Messages ──────────────────────────────────────────────────────────────────
function showMessage(msg, type) {
  const el = document.getElementById('message');
  el.textContent = msg;
  el.className   = `message ${type}`;
}

function clearMessage() {
  const el = document.getElementById('message');
  el.className = 'message';
  el.textContent = '';
}

// ── Password Toggle ───────────────────────────────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type      = 'text';
    btn.textContent = '🙈';
  } else {
    input.type      = 'password';
    btn.textContent = '👁️';
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(event) {
  event.preventDefault();

  if (!selectedRole) {
    showMessage('Please select your role first', 'error');
    return;
  }

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = event.target.querySelector('.submit-btn');

  btn.disabled    = true;
  btn.textContent = 'Signing in…';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const data = await res.json();

      if (data.role !== selectedRole) {
        showMessage(`This account is registered as ${data.role}, not ${selectedRole}`, 'error');
        return;
      }

      localStorage.setItem('token',    data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role',     data.role);

      showMessage('Login successful! Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    } else {
      const err = await res.text();
      showMessage(err || 'Login failed. Please check your credentials.', 'error');
    }
  } catch (err) {
    showMessage('Connection error. Please try again.', 'error');
    console.error('login:', err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Sign In';
  }
}

// ── Register ──────────────────────────────────────────────────────────────────
async function register(event) {
  event.preventDefault();

  const username        = document.getElementById('regUsername').value.trim();
  const email           = document.getElementById('regEmail').value.trim();
  const password        = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const role            = document.getElementById('regRole').value;
  const btn             = event.target.querySelector('.submit-btn');

  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters', 'error');
    return;
  }
  if (!role) {
    showMessage('Please select a role', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Creating account…';

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role })
    });

    if (res.ok) {
      showMessage('Account created! Please sign in.', 'success');
      setTimeout(showLogin, 2000);
    } else {
      const err = await res.text();
      showMessage(err || 'Registration failed', 'error');
    }
  } catch (err) {
    showMessage('Connection error. Please try again.', 'error');
    console.error('register:', err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Create Account';
  }
}