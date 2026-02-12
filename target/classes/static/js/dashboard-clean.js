// ==================== ANONYMOUS VOICE PLATFORM - DASHBOARD ==================== 
// Clean, modular code following SOLID principles
// Separation of Concerns: API, UI, Navigation, Products, Tickets, Calls

// ==================== CONFIGURATION ====================
const API_BASE = 'http://localhost:8080/api';
let token, username, role;

// ==================== AUTHENTICATION & INITIALIZATION ====================
window.onload = function () {
    token = localStorage.getItem('token');
    username = localStorage.getItem('username');
    role = localStorage.getItem('role');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    initializeTheme();
    document.getElementById('userNameDisplay').textContent = `${username} (${role})`;
    loadProducts();
    loadTickets();
    loadProductsForTicketForm();
};

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// ==================== THEME MANAGEMENT ====================
function initializeTheme() {
    const storedTheme = localStorage.getItem('theme');
    const iconSvg = document.getElementById('themeIconSvg');
    
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        iconSvg.innerHTML = '<circle cx="12" cy="12" r="5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="1" x2="12" y2="3" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke-width="2" stroke-linecap="round"/>';
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        iconSvg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const iconSvg = document.getElementById('themeIconSvg');
    
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        iconSvg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        iconSvg.innerHTML = '<circle cx="12" cy="12" r="5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="1" x2="12" y2="3" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke-width="2" stroke-linecap="round"/>';
    }
}

// ==================== NAVIGATION & UI ====================
function handleNavClick(viewId, button) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Show selected view and activate button
    document.getElementById(viewId).classList.add('active');
    button.classList.add('active');
    
    // Load data for the selected view
    if (viewId === 'productsView') {
        loadProducts();
    } else if (viewId === 'ticketsView') {
        loadTickets();
    } else if (viewId === 'callsView') {
        loadCalls();
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const btn = document.getElementById('mobileMenuBtn');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    btn.classList.toggle('active');
}

function toggleUserMenu() {
    const menu = document.getElementById('userDropdown');
    menu.classList.toggle('active');
}

function showProfile() {
    alert(`Profile: ${username}\nRole: ${role}`);
    toggleUserMenu();
}

// ==================== PRODUCTS MODULE ====================
async function loadProducts() {
    const container = document.getElementById('productsList');
    
    // Show loading state
    container.innerHTML = `
        <div class="skeleton-card product-skeleton"></div>
        <div class="skeleton-card product-skeleton"></div>
        <div class="skeleton-card product-skeleton"></div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const products = await response.json();
            setTimeout(() => displayProducts(products), 400);
        } else {
            container.innerHTML = '<p>Failed to load products.</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p>Failed to load products.</p>';
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsList');

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No products yet</h3>
                <p>Create your first product to get started</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <h3>${product.productName}</h3>
            <p>${product.description}</p>
            <div class="product-footer">
                <span class="product-category">${product.category}</span>
                <div class="product-actions">
                    <button class="btn-icon" onclick="editProduct(${product.productId})" title="Edit">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button class="btn-icon danger" onclick="deleteProduct(${product.productId})" title="Delete">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('productModalOverlay');
    const form = document.getElementById('createProductForm');
    const title = document.querySelector('#productModal .modal-title');
    const productIdField = document.getElementById('modalProductId');
    
    form.reset();
    
    // Store edit mode in form dataset
    form.dataset.editMode = productId ? 'true' : 'false';
    form.dataset.productId = productId || '';
    
    if (productId) {
        title.textContent = 'Edit Product';
        productIdField.readOnly = true;
        loadProductForEdit(productId);
    } else {
        title.textContent = 'Create Product';
        productIdField.readOnly = false;
        productIdField.placeholder = 'e.g., PRD-001';
        productIdField.value = '';
    }
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('productModalOverlay').classList.remove('active');
}

async function loadProductForEdit(productId) {
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const product = await response.json();
            document.getElementById('modalProductId').value = product.productId;
            document.getElementById('modalProductName').value = product.productName;
            document.getElementById('modalProductDescription').value = product.description;
        }
    } catch (error) {
        console.error('Error loading product:', error);
    }
}

async function submitProductModal(event) {
    event.preventDefault();
    
    const form = event.target;
    const isEditMode = form.dataset.editMode === 'true';
    const storedProductId = form.dataset.productId;
    
    const productData = {
        productId: isEditMode ? storedProductId : document.getElementById('modalProductId').value,
        productName: document.getElementById('modalProductName').value,
        description: document.getElementById('modalProductDescription').value
    };
    
    try {
        // For edit: use stored productId in URL, for create: don't include productId in URL
        const url = isEditMode ? `${API_BASE}/products/${storedProductId}` : `${API_BASE}/products`;
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            closeProductModal();
            loadProducts();
        } else {
            const error = await response.text();
            alert('Failed to save product: ' + error);
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product: ' + error.message);
    }
}

function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            loadProducts();
        } else {
            alert('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
    }
}

// ==================== TICKETS MODULE ====================
async function loadTickets() {
    const container = document.getElementById('ticketsList');
    container.innerHTML = '<p>Loading tickets...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/tickets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const tickets = await response.json();
            displayTickets(tickets);
        } else {
            container.innerHTML = '<p>Failed to load tickets.</p>';
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        container.innerHTML = '<p>Failed to load tickets.</p>';
    }
}

function displayTickets(tickets) {
    const container = document.getElementById('ticketsList');

    if (tickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No support tickets</h3>
                <p>Tickets will appear here when customers need help</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tickets.map(ticket => {
        const statusClass = ticket.status.toLowerCase();
        const priorityClass = ticket.priority.toLowerCase();
        
        return `
            <div class="ticket-item">
                <div class="ticket-header">
                    <h3>${ticket.subject}</h3>
                    <div class="ticket-badges">
                        <span class="badge status-${statusClass}">${ticket.status}</span>
                        <span class="badge priority-${priorityClass}">${ticket.priority}</span>
                    </div>
                </div>
                <p class="ticket-description">${ticket.description}</p>
                <div class="ticket-footer">
                    <span class="ticket-info">Product: ${ticket.product?.productName || 'N/A'}</span>
                    <span class="ticket-info">Customer: ${ticket.customerUsername}</span>
                    <div class="ticket-actions">
                        <button class="btn-sm" onclick="viewTicket(${ticket.ticketId})">View Details</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openTicketModal() {
    document.getElementById('ticketModal').classList.add('active');
    document.getElementById('ticketModalOverlay').classList.add('active');
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('active');
    document.getElementById('ticketModalOverlay').classList.remove('active');
}

async function loadProductsForTicketForm() {
    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const products = await response.json();
            const select = document.getElementById('modalTicketProduct');
            select.innerHTML = '<option value="">Select a product</option>' +
                products.map(p => `<option value="${p.productId}">${p.productName}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function submitTicketModal(event) {
    event.preventDefault();
    
    const ticketData = {
        subject: document.getElementById('modalTicketSubject').value,
        description: document.getElementById('modalTicketDescription').value,
        productId: document.getElementById('modalTicketProduct').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ticketData)
        });
        
        if (response.ok) {
            closeTicketModal();
            document.getElementById('createTicketForm').reset();
            loadTickets();
        } else {
            const error = await response.text();
            alert('Failed to create ticket: ' + error);
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        alert('Error creating ticket: ' + error.message);
    }
}

function viewTicket(ticketId) {
    alert(`View ticket ${ticketId} - Full ticket view coming soon`);
}

// ==================== CALLS MODULE ====================
async function loadCalls() {
    const container = document.getElementById('callsList');
    container.innerHTML = '<p>Loading call logs...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/calls`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const calls = await response.json();
            displayCalls(calls);
        } else {
            container.innerHTML = '<p>Failed to load call logs.</p>';
        }
    } catch (error) {
        console.error('Error loading calls:', error);
        container.innerHTML = '<p>Failed to load call logs.</p>';
    }
}

function displayCalls(calls) {
    const container = document.getElementById('callsList');

    if (calls.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No call logs</h3>
                <p>Call history will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = calls.map(call => {
        const statusClass = call.callStatus.toLowerCase();
        const date = new Date(call.startTime).toLocaleString();
        
        return `
            <div class="call-log-item">
                <div class="call-log-header">
                    <span class="call-log-time">${date}</span>
                    <span class="badge status-${statusClass}">${call.callStatus}</span>
                </div>
                <div class="call-log-details">
                    <p><strong>Duration:</strong> ${call.duration || 'N/A'}</p>
                    <p><strong>Notes:</strong> ${call.notes || 'No notes'}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== VOICE CALL WIDGET ====================
let localStream = null;
let peerConnection = null;
let isMuted = false;

function toggleVoicePanel() {
    const panel = document.getElementById('voicePanel');
    const btn = document.getElementById('voiceFloatingBtn');
    panel.classList.toggle('active');
    btn.style.display = panel.classList.contains('active') ? 'none' : 'flex';
}

function closeVoicePanel() {
    document.getElementById('voicePanel').classList.remove('active');
    document.getElementById('voiceFloatingBtn').style.display = 'flex';
    if (peerConnection) {
        endCall();
    }
}

async function startCall() {
    try {
        // Request microphone access
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Initialize WebRTC peer connection
        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        // Add local stream to peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        document.getElementById('callStatus').textContent = 'Call started...';
        document.getElementById('callControls').classList.add('active');
        
        // TODO: Implement signaling server connection
        console.log('Call started - Signaling integration needed');
    } catch (error) {
        console.error('Error starting call:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

function toggleMute() {
    if (!localStream) return;
    
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
    });
    
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.classList.toggle('muted', isMuted);
    muteBtn.title = isMuted ? 'Unmute' : 'Mute';
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    document.getElementById('callStatus').textContent = 'Not in call';
    document.getElementById('callControls').classList.remove('active');
    isMuted = false;
}

// ==================== CLOSE EVENT LISTENERS ====================
// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('userDropdown');
    const userMenuBtn = document.getElementById('userMenuBtn');
    
    if (userMenu && !userMenu.contains(event.target) && !userMenuBtn.contains(event.target)) {
        userMenu.classList.remove('active');
    }
});
