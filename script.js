/**
 * Chronos | Personal Project Roadmap & Milestone Tracker
 * Vanilla JavaScript Logic
 */

// --- Data Management ---
let state = {
    projects: [],
    activeProjectId: null,
    filter: 'all'
};

const COLORS = [
    '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899', '#ffffff'
];

// Initialize Data
function init() {
    const saved = localStorage.getItem('chronos_data');
    if (saved) {
        state = JSON.parse(saved);
        // Reset filter on refresh
        state.filter = 'all';
    } else {
        // Sample Project
        const sampleId = 'p-' + Date.now();
        state.projects = [{
            id: sampleId,
            name: 'Sample Project',
            description: 'This is an example roadmap. Click milestones to mark them as done!',
            start: new Date().toISOString().split('T')[0],
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            color: '#6366f1',
            milestones: [
                { id: 'm1', title: 'Conceptual Design', date: new Date().toISOString().split('T')[0], status: 'completed', urgency: 'low', notes: 'Initial brainstorm and sketches.' },
                { id: 'm2', title: 'Build Prototype', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'in-progress', urgency: 'medium', notes: 'Using vanilla JS and CSS.' },
                { id: 'm3', title: 'Testing Phase', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending', urgency: 'critical', notes: 'Cross-browser testing.' }
            ]
        }];
        state.activeProjectId = sampleId;
        saveData();
    }
    
    renderApp();
    setupEventListeners();
    lucide.createIcons();
}

function saveData() {
    localStorage.setItem('chronos_data', JSON.stringify(state));
}

// --- App State Management ---
function setActiveProject(id) {
    state.activeProjectId = id;
    state.filter = 'all';
    saveData();
    renderApp();
}

function addProject(project) {
    state.projects.push(project);
    state.activeProjectId = project.id;
    saveData();
    renderApp();
}

function deleteProject(id) {
    state.projects = state.projects.filter(p => p.id !== id);
    if (state.activeProjectId === id) {
        state.activeProjectId = state.projects.length > 0 ? state.projects[0].id : null;
    }
    saveData();
    renderApp();
}

function addMilestone(projectId, milestone) {
    const project = state.projects.find(p => p.id === projectId);
    if (project) {
        project.milestones.push(milestone);
        sortMilestones(project);
        saveData();
        renderApp();
    }
}

function updateMilestone(projectId, milestoneId, updates) {
    const project = state.projects.find(p => p.id === projectId);
    if (project) {
        const index = project.milestones.findIndex(m => m.id === milestoneId);
        if (index !== -1) {
            project.milestones[index] = { ...project.milestones[index], ...updates };
            sortMilestones(project);
            saveData();
            renderApp();
            
            // Check for completion celebration
            if (updates.status === 'completed' && project.milestones.every(m => m.status === 'completed')) {
                runConfetti();
            }
        }
    }
}

function deleteMilestone(projectId, milestoneId) {
    const project = state.projects.find(p => p.id === projectId);
    if (project) {
        project.milestones = project.milestones.filter(m => m.id !== milestoneId);
        saveData();
        renderApp();
    }
}

function sortMilestones(project) {
    project.milestones.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// --- UI Rendering ---
function renderApp() {
    renderStats();
    renderSidebar();
    renderProjectView();
    lucide.createIcons();
}

function renderStats() {
    const totalProjects = state.projects.length;
    const allMilestones = state.projects.flatMap(p => p.milestones);
    const completed = allMilestones.filter(m => m.status === 'completed').length;
    
    // Auto-calculate overdue
    const now = new Date();
    now.setHours(0,0,0,0);
    const overdue = allMilestones.filter(m => {
        const dueDate = new Date(m.date);
        return m.status !== 'completed' && dueDate < now;
    }).length;

    const progress = allMilestones.length > 0 ? Math.round((completed / allMilestones.length) * 100) : 0;

    document.getElementById('stat-projects').textContent = totalProjects;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-overdue').textContent = overdue;
    document.getElementById('stat-progress').textContent = progress + '%';
    document.getElementById('stat-progress-fill').style.width = progress + '%';
}

function renderSidebar() {
    const list = document.getElementById('project-list');
    const searchTerm = document.getElementById('project-search').value.toLowerCase();
    
    list.innerHTML = '';
    
    const filteredProjects = state.projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
    );

    filteredProjects.forEach(project => {
        const li = document.createElement('li');
        li.className = `project-item ${project.id === state.activeProjectId ? 'active' : ''}`;
        li.onclick = () => setActiveProject(project.id);
        
        const completed = project.milestones.filter(m => m.status === 'completed').length;
        const total = project.milestones.length;

        li.innerHTML = `
            <div class="project-indicator" style="background-color: ${project.color}"></div>
            <div class="project-info">
                <span class="project-name">${escapeHtml(project.name)}</span>
                <span class="project-meta-summary">${completed}/${total} milestones</span>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderProjectView() {
    const projectView = document.getElementById('project-view');
    const emptyState = document.getElementById('empty-state');
    
    const project = state.projects.find(p => p.id === state.activeProjectId);
    
    if (!project) {
        projectView.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    projectView.classList.remove('hidden');
    emptyState.classList.add('hidden');

    document.getElementById('current-project-name').textContent = project.name;
    document.getElementById('current-project-desc').textContent = project.description;
    document.getElementById('current-project-dates').textContent = `${formatDate(project.start)} - ${formatDate(project.end)}`;

    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    const sortedMilestones = [...project.milestones];
    const now = new Date();
    now.setHours(0,0,0,0);

    const filteredMilestones = sortedMilestones.filter(m => {
        if (state.filter === 'all') return true;
        if (state.filter === 'overdue') {
            return m.status !== 'completed' && new Date(m.date) < now;
        }
        return m.status === state.filter;
    });

    if (filteredMilestones.length === 0) {
        timeline.innerHTML = `<p class="empty-text">No milestones found for this filter.</p>`;
    }

    filteredMilestones.forEach((m, index) => {
        const isOverdue = m.status !== 'completed' && new Date(m.date) < now;
        const statusClass = isOverdue ? 'overdue' : m.status;
        
        const node = document.createElement('div');
        node.className = `milestone-node ${statusClass}`;
        
        // Staggered entrance animation
        setTimeout(() => node.classList.add('visible'), index * 100);

        const daysDiff = getDaysDiff(m.date);
        let countdownText = '';
        if (m.status !== 'completed') {
            if (daysDiff < 0) countdownText = `${Math.abs(daysDiff)} days overdue`;
            else if (daysDiff === 0) countdownText = `Due today`;
            else countdownText = `${daysDiff} days left`;
        }

        node.innerHTML = `
            <div class="milestone-marker">
                <i data-lucide="check"></i>
            </div>
            <div class="milestone-content" onclick="toggleMilestone('${project.id}', '${m.id}')">
                <div class="milestone-header">
                    <h3>${escapeHtml(m.title)}</h3>
                    <span class="milestone-urgency urgency-${m.urgency}">${m.urgency}</span>
                </div>
                <div class="milestone-details">
                    <span class="meta-item"><i data-lucide="calendar"></i> ${formatDate(m.date)}</span>
                    <span class="meta-item ${isOverdue ? 'text-error' : ''}"><i data-lucide="clock"></i> ${countdownText || m.status}</span>
                </div>
                ${m.notes ? `<p class="milestone-notes">${escapeHtml(m.notes)}</p>` : ''}
                <div class="milestone-actions">
                    <button class="icon-btn edit-m-btn" onclick="openEditMilestone(event, '${m.id}')"><i data-lucide="edit-3"></i></button>
                    <button class="icon-btn danger-btn" onclick="confirmDeleteMilestone(event, '${m.id}')"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
        timeline.appendChild(node);
    });
    
    lucide.createIcons();
}

// --- Interaction Logic ---
function toggleMilestone(projectId, milestoneId) {
    const project = state.projects.find(p => p.id === projectId);
    const m = project.milestones.find(mil => mil.id === milestoneId);
    
    const newStatus = m.status === 'completed' ? 'pending' : 'completed';
    updateMilestone(projectId, milestoneId, { status: newStatus });
}

// Global exposure for dynamically generated HTML handlers
window.toggleMilestone = toggleMilestone;
window.openEditMilestone = openEditMilestone;
window.confirmDeleteMilestone = confirmDeleteMilestone;
window.setActiveProject = setActiveProject;

function setupEventListeners() {
    // Project Search
    document.getElementById('project-search').addEventListener('input', renderSidebar);

    // Filter Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            state.filter = e.target.dataset.filter;
            renderProjectView();
        });
    });

    // Modals
    const projectModal = document.getElementById('project-modal');
    const milestoneModal = document.getElementById('milestone-modal');

    document.getElementById('add-project-btn').onclick = () => openProjectModal();
    document.getElementById('empty-add-project-btn').onclick = () => openProjectModal();
    
    document.getElementById('add-milestone-btn').onclick = () => {
        currentEditMilestoneId = null;
        document.getElementById('milestone-modal-title').textContent = 'Add Milestone';
        document.getElementById('milestone-form').reset();
        milestoneModal.classList.add('active');
    };

    document.querySelectorAll('.closeModal').forEach(btn => {
        btn.onclick = () => {
            projectModal.classList.remove('active');
            milestoneModal.classList.remove('active');
        };
    });

    // Project Form
    document.getElementById('project-form').onsubmit = (e) => {
        e.preventDefault();
        const project = {
            id: currentEditProjectId || 'p-' + Date.now(),
            name: document.getElementById('p-name').value,
            description: document.getElementById('p-desc').value,
            start: document.getElementById('p-start').value,
            end: document.getElementById('p-end').value,
            color: document.getElementById('p-color').value,
            milestones: currentEditProjectId ? state.projects.find(p => p.id === currentEditProjectId).milestones : []
        };

        if (currentEditProjectId) {
            const idx = state.projects.findIndex(p => p.id === currentEditProjectId);
            state.projects[idx] = project;
        } else {
            addProject(project);
        }
        
        saveData();
        renderApp();
        projectModal.classList.remove('active');
    };

    // Milestone Form
    document.getElementById('milestone-form').onsubmit = (e) => {
        e.preventDefault();
        const milestone = {
            id: currentEditMilestoneId || 'm-' + Date.now(),
            title: document.getElementById('m-title').value,
            date: document.getElementById('m-date').value,
            urgency: document.getElementById('m-urgency').value,
            notes: document.getElementById('m-notes').value,
            status: currentEditMilestoneId ? state.projects.find(p => p.id === state.activeProjectId).milestones.find(m => m.id === currentEditMilestoneId).status : 'pending'
        };

        if (currentEditMilestoneId) {
            updateMilestone(state.activeProjectId, currentEditMilestoneId, milestone);
        } else {
            addMilestone(state.activeProjectId, milestone);
        }
        
        milestoneModal.classList.remove('active');
    };

    // Delete Project
    document.getElementById('delete-project-btn').onclick = () => {
        if (confirm('Are you sure you want to delete this project? All milestones will be lost.')) {
            deleteProject(state.activeProjectId);
        }
    };

    // Edit Project
    document.getElementById('edit-project-btn').onclick = () => {
        openProjectModal(state.activeProjectId);
    };

    // Export/Import
    document.getElementById('export-btn').onclick = exportData;
    document.getElementById('import-btn-trigger').onclick = () => document.getElementById('import-btn').click();
    document.getElementById('import-btn').onchange = importData;

    // Build Color Picker
    const picker = document.getElementById('p-color-picker');
    COLORS.forEach(color => {
        const opt = document.createElement('div');
        opt.className = 'color-option';
        opt.style.backgroundColor = color;
        if (color === '#6366f1') opt.classList.add('selected');
        opt.onclick = () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            document.getElementById('p-color').value = color;
        };
        picker.appendChild(opt);
    });
}

let currentEditProjectId = null;
let currentEditMilestoneId = null;

function openProjectModal(editId = null) {
    currentEditProjectId = editId;
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    form.reset();
    
    if (editId) {
        const p = state.projects.find(proj => proj.id === editId);
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-desc').value = p.description;
        document.getElementById('p-start').value = p.start;
        document.getElementById('p-end').value = p.end;
        document.getElementById('p-color').value = p.color;
        document.getElementById('project-modal-title').textContent = 'Edit Project';
    } else {
        document.getElementById('project-modal-title').textContent = 'Create New Project';
    }
    
    modal.classList.add('active');
}

function openEditMilestone(e, mId) {
    e.stopPropagation();
    currentEditMilestoneId = mId;
    const project = state.projects.find(p => p.id === state.activeProjectId);
    const m = project.milestones.find(mil => mil.id === mId);
    
    document.getElementById('m-title').value = m.title;
    document.getElementById('m-date').value = m.date;
    document.getElementById('m-urgency').value = m.urgency;
    document.getElementById('m-notes').value = m.notes;
    
    document.getElementById('milestone-modal-title').textContent = 'Edit Milestone';
    document.getElementById('milestone-modal').classList.add('active');
}

function confirmDeleteMilestone(e, mId) {
    e.stopPropagation();
    if (confirm('Delete this milestone?')) {
        deleteMilestone(state.activeProjectId, mId);
    }
}

// --- Utilities ---
function formatDate(dateStr) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

function getDaysDiff(dateStr) {
    const now = new Date();
    now.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);
    const diffTime = target - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "chronos_roadmap.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.projects) {
                state = imported;
                saveData();
                renderApp();
                alert('Data imported successfully!');
            }
        } catch (err) {
            alert('Invalid JSON file.');
        }
    };
    reader.readAsText(file);
}

// --- Confetti Effect ---
function runConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const colors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#0ea5e9'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 7 + 4,
            speed: Math.random() * 5 + 2,
            angle: Math.random() * 2 * Math.PI,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.y += p.speed;
            p.x += Math.sin(p.angle) * 2;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            
            if (p.y > canvas.height) {
                particles.splice(i, 1);
            }
        });

        if (particles.length > 0) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    animate();
}

// Bootstrap
document.addEventListener('DOMContentLoaded', init);
