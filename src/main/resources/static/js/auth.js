const API_BASE = 'http://localhost:8080/api';
let selectedRole = null;

function selectRole(element, role) {
    console.log('selectRole called with:', 'element:', element, 'role:', role);
    selectedRole = role;
    console.log('selectedRole set to:', selectedRole);
    document.getElementById('selectedRole').value = role;
    
    // Remove selected class from all role cards
    document.querySelectorAll('.role').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    element.classList.add('selected');
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    clearMessage();
    selectedRole = null;
    document.querySelectorAll('.role').forEach(card => {
        card.classList.remove('selected');
    });
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    clearMessage();
}

function showMessage(message, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = message;
    msgDiv.className = `message-new ${type}`;
    msgDiv.style.display = 'block';
}

function clearMessage() {
    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none';
}

async function login(event) {
    event.preventDefault();
    
    console.log('Login attempt - selectedRole:', selectedRole, 'type:', typeof selectedRole);
    
    if (!selectedRole) {
        showMessage('Please select your role first', 'error');
        return;
    }
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('Login response - data.role:', data.role, 'selectedRole:', selectedRole);
            
            // Verify role matches selected role
            if (data.role !== selectedRole) {
                showMessage(`This account is registered as ${data.role}, not ${selectedRole}`, 'error');
                return;
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            const error = await response.text();
            showMessage(error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Connection error. Please try again.', 'error');
        console.error('Login error:', error);
    }
}

async function register(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const role = document.getElementById('regRole').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, role })
        });
        
        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            setTimeout(() => {
                showLogin();
            }, 2000);
        } else {
            const error = await response.text();
            showMessage(error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Connection error. Please try again.', 'error');
        console.error('Registration error:', error);
    }
}
