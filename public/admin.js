
const API_BASE = '/api/v1/connections';
const connectionsList = document.getElementById('connectionsList');
const wizardModal = document.getElementById('connectionWizard');
const toastEl = document.getElementById('toast');
const searchInput = document.getElementById('globalSearch');

// State
let connectionsData = [];
let currentStep = 1;
const TOTAL_STEPS = 4;
let wizardData = {};
let isEditMode = false;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    loadConnections();
    setupWizardEvents();
    setupSearch();
    checkHealth();
});

// --- SEARCH ---
function setupSearch() {
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = connectionsData.filter(c =>
            (c.websiteName && c.websiteName.toLowerCase().includes(term)) ||
            (c.connectionId && c.connectionId.toLowerCase().includes(term))
        );
        renderConnections(filtered);
    });
}

// --- CONNECTIONS ---
async function loadConnections() {
    try {
        const res = await fetch(`${API_BASE}/list`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        connectionsData = data; // Store for search
        renderConnections(data);

        // Update Focus Widget (Mock Logic for now, can be real later)
        // updateFocusWidgets(data); 

    } catch (err) {
        showToast('Failed to load connections: ' + err.message, true);
    }
}

function renderConnections(data) {
    connectionsList.innerHTML = '';

    if (data.length === 0) {
        connectionsList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No connections found.</div>';
        return;
    }

    data.forEach(conn => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="robot-avatar">🤖</div>
                    <div>
                        <div class="card-title">${conn.websiteName || 'Untitled'}</div>
                        <div class="card-subtitle">${conn.connectionId}</div>
                    </div>
                </div>
                <span class="ai-badge">AI Assistant</span>
            </div>
            
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                Created: ${new Date(conn.createdAt).toLocaleDateString()}
            </div>

            <div class="card-actions">
                <button class="btn secondary" onclick="editConnection('${conn.connectionId}')">Edit</button>
                <button class="btn btn-danger-outline" onclick="deleteConnection('${conn.connectionId}')">Delete</button>
            </div>
        `;
        connectionsList.appendChild(card);
    });
}

// --- ACTIONS ---
window.deleteConnection = async (id) => {
    if (!confirm(`Are you sure you want to delete ${id}?`)) return;
    try {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Connection deleted');
            loadConnections();
        } else {
            throw new Error('Failed to delete');
        }
    } catch (err) {
        showToast(err.message, true);
    }
};

window.editConnection = async (id) => {
    try {
        const res = await fetch(`${API_BASE}/${id}/details`);
        if (!res.ok) throw new Error('Fetch details failed');
        const data = await res.json();

        isEditMode = true;
        openWizard(); // Reset handled inside

        // Override for Edit
        document.getElementById('connectionId').value = data.connectionId;
        document.getElementById('connectionId').readOnly = true;
        document.getElementById('websiteName').value = data.websiteName || '';
        document.getElementById('websiteUrl').value = data.websiteUrl || '';

        if (data.behaviorProfile) {
            const fSlider = document.getElementById('formalitySlider');
            const sSlider = document.getElementById('salesSlider');
            if (fSlider) fSlider.value = data.behaviorProfile.tone === 'formal' ? 80 : 20;
            if (sSlider) sSlider.value = (data.behaviorProfile.salesIntensity || 0.4) * 100;
        }
    } catch (err) {
        showToast(err.message, true);
    }
};

// --- WIZARD ---
function setupWizardEvents() {
    const newBtn = document.getElementById('newConnectionBtn'); // FAB
    if (newBtn) newBtn.addEventListener('click', () => { isEditMode = false; openWizard(); });

    // Header button if it existed (removed in new layout but good safety)
    // document.getElementById('newConnectionBtnHeader')?.addEventListener('click', ...);

    document.getElementById('cancelBtn').addEventListener('click', closeWizard);
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
}

function openWizard() {
    wizardModal.classList.add('active');
    currentStep = 1;
    updateWizardUI();

    // Reset if New
    if (!isEditMode) {
        document.getElementById('wizardForm').reset();
        document.getElementById('connectionId').readOnly = false;
        document.getElementById('connectionId').value = 'conn_' + Date.now();
    }
}

function closeWizard() {
    wizardModal.classList.remove('active');
}

async function nextStep() {
    if (!validateStep(currentStep)) return;

    if (currentStep < TOTAL_STEPS) {
        // Collect Data if needed per step
        if (currentStep === 1) {
            wizardData.connectionId = document.getElementById('connectionId').value;
            wizardData.websiteName = document.getElementById('websiteName').value;
            wizardData.websiteUrl = document.getElementById('websiteUrl').value;
        }

        // Save on Step 3 (before Deploy step 4)
        if (currentStep === 3) {
            const success = await saveConnection();
            if (!success) return;
        }

        currentStep++;
        updateWizardUI();
    } else {
        closeWizard();
        loadConnections();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateWizardUI();
    }
}

function updateWizardUI() {
    // Steps
    document.querySelectorAll('.step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        el.classList.remove('active');
        if (stepNum === currentStep) el.classList.add('active');
        // Completed styling could be added via CSS
    });

    // Panels
    document.querySelectorAll('.step-panel').forEach(el => el.classList.remove('active'));
    const panel = document.getElementById(`step${currentStep}`);
    if (panel) {
        panel.classList.add('active');
    } else {
        console.error(`Wizard panel step${currentStep} not found!`);
    }

    // Buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

    if (currentStep === TOTAL_STEPS) {
        nextBtn.textContent = 'Finish';
    } else if (currentStep === 3) {
        nextBtn.textContent = isEditMode ? 'Update' : 'Create & Deploy';
    } else {
        nextBtn.textContent = 'Next';
    }
}

function validateStep(step) {
    if (step === 1) {
        if (!document.getElementById('connectionId').value) {
            showToast('Connection ID is required', true);
            return false;
        }
    }
    return true;
}

async function saveConnection() {
    const payload = {
        connectionId: wizardData.connectionId,
        websiteName: wizardData.websiteName,
        websiteUrl: wizardData.websiteUrl,
        behaviorProfile: {
            tone: document.getElementById('formalitySlider').value > 50 ? 'formal' : 'friendly',
            salesIntensity: document.getElementById('salesSlider').value / 100
        }
    };

    try {
        const url = isEditMode ? `${API_BASE}/${wizardData.connectionId}` : `${API_BASE}/create`;
        const method = isEditMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');

        // Populate Deploy Script
        const script = `<script src="http://${location.hostname}:5000/widget.js?id=${wizardData.connectionId}"></script>`;
        document.getElementById('embedCode').value = script;
        showToast(isEditMode ? 'Updated!' : 'Created!');
        return true;
    } catch (err) {
        showToast(err.message, true);
        return false;
    }
}

// --- UTILS ---
function showToast(msg, isError = false) {
    toastEl.textContent = msg;
    toastEl.style.borderLeftColor = isError ? 'var(--error)' : 'var(--success)';
    toastEl.classList.add('active');
    setTimeout(() => toastEl.classList.remove('active'), 3000);
}

window.copyEmbed = () => {
    const copyText = document.getElementById("embedCode");
    copyText.select();
    document.execCommand("copy");
    showToast("Copied to clipboard!");
};

function checkHealth() {
    fetch('/health')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(() => {
            const h = document.getElementById('healthStatus');
            if (h) {
                h.querySelector('.status-text').textContent = 'Backend Online';
                h.classList.remove('offline');
            }
        })
        .catch(() => {
            const h = document.getElementById('healthStatus');
            if (h) {
                h.querySelector('.status-text').textContent = 'Backend Offline';
                h.classList.add('offline');
            }
        });
}
