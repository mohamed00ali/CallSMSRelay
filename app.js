// App State
let appState = {
    currentScreen: 'splash',
    currentTab: 'home',
    currentAddDeviceStep: 1,
    selectedConnectionMode: null,
    pairedDevices: [],
    messages: [],
    activities: [],
    settings: {
        connectionMethod: 'bluetooth',
        callNotifications: true,
        smsNotifications: true,
        ringtone: 'classic',
        theme: 'dark',
        autoReconnect: true,
        vibrationEnabled: true
    }
};

// Initialize App
window.addEventListener('load', () => {
    loadSettings();
    setTimeout(showOnboarding, 2000);
    setupEventListeners();
});

function loadSettings() {
    const saved = localStorage.getItem('notifySettings');
    if (saved) {
        appState.settings = { ...appState.settings, ...JSON.parse(saved) };
        applyTheme(appState.settings.theme);
    }
}

function saveSettings() {
    localStorage.setItem('notifySettings', JSON.stringify(appState.settings));
}

function setupEventListeners() {
    // Onboarding dots
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            const slide = e.target.dataset.dot;
            goToSlide(slide);
        });
    });
}

// Screen Management
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + 'Screen').classList.add('active');
    appState.currentScreen = screenName;
}

function showOnboarding() {
    if (!localStorage.getItem('notifyOnboarded')) {
        showScreen('onboarding');
        startPairingCodeTimer();
    } else {
        showMainApp();
    }
}

function showMainApp() {
    showScreen('main');
    loadConnectedDevices();
    loadMessages();
}

function completeOnboarding() {
    localStorage.setItem('notifyOnboarded', 'true');
    showMainApp();
}

// Onboarding Navigation
function goToSlide(slideNum) {
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.dot');
    
    slides.forEach(s => s.style.display = 'none');
    dots.forEach(d => d.classList.remove('active'));
    
    const slideEl = document.querySelector(`[data-slide="${slideNum}"]`);
    const dotEl = document.querySelector(`[data-dot="${slideNum}"]`);
    
    if (slideEl) slideEl.style.display = 'block';
    if (dotEl) dotEl.classList.add('active');
    
    const nextBtn = document.getElementById('nextBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    if (slideNum === '3') {
        nextBtn.textContent = 'ابدأ الآن';
        skipBtn.style.display = 'none';
    } else {
        nextBtn.textContent = 'التالي';
        skipBtn.style.display = 'block';
    }
}

function nextSlide() {
    const slides = document.querySelectorAll('.onboarding-slide');
    let currentSlide = 1;
    
    slides.forEach((s, i) => {
        if (s.style.display !== 'none') currentSlide = parseInt(s.dataset.slide);
    });
    
    if (currentSlide === 3) {
        completeOnboarding();
    } else {
        goToSlide(currentSlide + 1);
    }
}

function goToHome() {
    completeOnboarding();
}

// Tab Navigation
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    appState.currentTab = tabName;
}

function goToSettings() {
    switchTab('settings');
}

function goToDevices() {
    switchTab('devices');
}

// Device Management
function loadConnectedDevices() {
    const saved = localStorage.getItem('pairedDevices');
    appState.pairedDevices = saved ? JSON.parse(saved) : [];
    
    const devicesList = document.getElementById('devicesList');
    
    if (appState.pairedDevices.length === 0) {
        devicesList.innerHTML = '<p class="empty-state">لم يتم ربط أي جهاز</p>';
    } else {
        devicesList.innerHTML = appState.pairedDevices.map(device => `
            <div class="device-item">
                <div class="device-item-info">
                    <div class="device-item-avatar">📱</div>
                    <div class="device-item-details">
                        <h3>${device.name}</h3>
                        <p>${device.model}</p>
                        <p style="font-size: 12px; color: var(--text-secondary);">متصل: ${device.lastSeen}</p>
                    </div>
                </div>
                <div class="device-item-actions">
                    <button class="btn-secondary" onclick="editDevice('${device.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="unlinkDevice('${device.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateConnectionStatus();
}

function updateConnectionStatus() {
    if (appState.pairedDevices.length > 0) {
        const device = appState.pairedDevices[0];
        document.getElementById('statusBadge').innerHTML = 
            '<i class="fas fa-dot-circle"></i> متصل';
        document.getElementById('statusBadge').style.color = '#10b981';
        document.getElementById('connectedDeviceName').textContent = device.name;
        document.getElementById('connectedDeviceModel').textContent = device.model;
        document.getElementById('methodBadge').textContent = device.connectionMethod;
    }
}

function startAddDevice() {
    openModal('addDeviceModal');
    appState.currentAddDeviceStep = 1;
    showAddDeviceStep(1);
}

function selectConnectionMode(mode) {
    appState.selectedConnectionMode = mode;
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    event.target.closest('.option-btn').classList.add('active');
    setTimeout(() => nextStep(), 500);
}

function showAddDeviceStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelector(`[data-step="${step}"]`).classList.add('active');
    appState.currentAddDeviceStep = step;
}

function nextStep() {
    if (appState.currentAddDeviceStep < 4) {
        if (appState.currentAddDeviceStep === 1 && !appState.selectedConnectionMode) {
            alert('اختر طريقة اتصال أولاً');
            return;
        }
        
        if (appState.currentAddDeviceStep === 1) {
            simulateDeviceDiscovery();
        }
        
        appState.currentAddDeviceStep++;
        showAddDeviceStep(appState.currentAddDeviceStep);
        
        if (appState.currentAddDeviceStep === 3) {
            generatePairingCode();
        }
        
        if (appState.currentAddDeviceStep === 4) {
            addPairedDevice();
        }
    }
}

function prevStep() {
    if (appState.currentAddDeviceStep > 1) {
        appState.currentAddDeviceStep--;
        showAddDeviceStep(appState.currentAddDeviceStep);
    }
}

function simulateDeviceDiscovery() {
    const availableDevices = [
        { id: 'dev1', name: 'Samsung Galaxy', model: 'SM-A515F' },
        { id: 'dev2', name: 'iPhone 12', model: 'iPhone 12 Pro' },
        { id: 'dev3', name: 'Xiaomi Redmi', model: 'Note 10' }
    ];
    
    const container = document.getElementById('availableDevices');
    container.innerHTML = availableDevices.map(dev => `
        <div class="device-option" onclick="selectDevice('${dev.id}', '${dev.name}', '${dev.model}')">
            <div class="device-item-avatar">📱</div>
            <div class="device-option-info">
                <h4>${dev.name}</h4>
                <p>${dev.model}</p>
            </div>
        </div>
    `).join('');
}

function selectDevice(id, name, model) {
    document.querySelectorAll('.device-option').forEach(d => d.style.borderColor = '#334155');
    event.currentTarget.style.borderColor = 'var(--primary-color)';
    
    setTimeout(() => nextStep(), 300);
}

function generatePairingCode() {
    const code = Math.random().toString().slice(2, 8);
    document.getElementById('pairingCode').textContent = code;
    let timer = 120;
    
    const interval = setInterval(() => {
        timer--;
        document.getElementById('codeTimer').textContent = timer;
        if (timer === 0) clearInterval(interval);
    }, 1000);
}

function copyPairingCode() {
    const code = document.getElementById('pairingCode').textContent;
    navigator.clipboard.writeText(code);
    alert('تم نسخ الرمز');
}

function addPairedDevice() {
    const device = {
        id: Date.now().toString(),
        name: 'Samsung Galaxy',
        model: 'SM-A515F',
        connectionMethod: appState.selectedConnectionMode || 'bluetooth',
        lastSeen: new Date().toLocaleString('ar-SA'),
        pairingCode: document.getElementById('pairingCode').textContent
    };
    
    appState.pairedDevices.push(device);
    localStorage.setItem('pairedDevices', JSON.stringify(appState.pairedDevices));
    
    document.getElementById('successDeviceName').textContent = device.name;
    addActivity('ربط جهاز: ' + device.name);
}

function unlinkDevice(id) {
    if (confirm('هل تريد إلغاء ربط هذا الجهاز؟')) {
        appState.pairedDevices = appState.pairedDevices.filter(d => d.id !== id);
        localStorage.setItem('pairedDevices', JSON.stringify(appState.pairedDevices));
        loadConnectedDevices();
        addActivity('إلغاء ربط جهاز');
    }
}

function unlinkAllDevices() {
    if (confirm('هل تريد إلغاء ربط جميع الأجهزة؟')) {
        appState.pairedDevices = [];
        localStorage.setItem('pairedDevices', JSON.stringify(appState.pairedDevices));
        loadConnectedDevices();
    }
}

// Messages Management
function loadMessages() {
    const saved = localStorage.getItem('smsMessages');
    appState.messages = saved ? JSON.parse(saved) : [];
    
    const messagesList = document.getElementById('messagesList');
    
    if (appState.messages.length === 0) {
        messagesList.innerHTML = '<p class="empty-state">لا توجد رسائل</p>';
    } else {
        messagesList.innerHTML = appState.messages.map(msg => `
            <div class="message-item">
                <div class="message-sender">${msg.sender}</div>
                <div class="message-number">${msg.number}</div>
                <div class="message-text">${msg.text}</div>
                <div class="message-time" style="color: var(--text-secondary); font-size: 12px;">${msg.time}</div>
            </div>
        `).join('');
    }
}

function addMessage(sender, number, text) {
    const message = {
        id: Date.now().toString(),
        sender,
        number,
        text,
        time: new Date().toLocaleTimeString('ar-SA')
    };
    
    appState.messages.unshift(message);
    localStorage.setItem('smsMessages', JSON.stringify(appState.messages));
    loadMessages();
    showSmsToast(sender, text);
}

function simulateIncomingSms() {
    addMessage('أحمد', '01012345678', 'السلام عليكم، كيف حالك؟');
    addActivity('رسالة نصية من أحمد');
}

function simulateIncomingCall() {
    showCallAlert('أحمد', '01012345678', 'Samsung Galaxy');
    addActivity('مكالمة واردة من أحمد');
}

// Activity Management
function addActivity(description) {
    const activity = {
        id: Date.now().toString(),
        description,
        time: new Date().toLocaleTimeString('ar-SA'),
        date: new Date().toLocaleDateString('ar-SA')
    };
    
    appState.activities.unshift(activity);
    if (appState.activities.length > 5) appState.activities.pop();
    
    updateActivityDisplay();
}

function updateActivityDisplay() {
    const container = document.getElementById('recentActivity');
    
    if (appState.activities.length === 0) {
        container.innerHTML = '<p class="empty-state">لا توجد نشاطات حالياً</p>';
    } else {
        container.innerHTML = appState.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-item-info">
                    <p>${activity.description}</p>
                    <p style="color: var(--text-secondary); font-size: 12px;">${activity.date}</p>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }
}

// Notifications
function showCallAlert(caller, number, device) {
    const alert = document.getElementById('callAlert');
    document.getElementById('callerName').textContent = caller;
    document.getElementById('callerNumber').textContent = number;
    document.getElementById('callFromDevice').textContent = device;
    
    alert.classList.add('active');
    playCallSound();
    vibrate([200, 100, 200, 100, 200]);
    
    setTimeout(() => closeCallAlert(), 5000);
}

function closeCallAlert() {
    document.getElementById('callAlert').classList.remove('active');
}

function showSmsToast(sender, text) {
    const toast = document.getElementById('smsToast');
    document.getElementById('smsFrom').textContent = 'من: ' + sender;
    document.getElementById('smsPreview').textContent = text.substring(0, 50) + (text.length > 50 ? '...' : '');
    
    toast.classList.add('active');
    playSmsSound();
    vibrate([100, 50, 100]);
    
    setTimeout(() => toast.classList.remove('active'), 4000);
}

function playCallSound() {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 5);
}

function playSmsSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
}

function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Settings
function updateSettings() {
    appState.settings.callNotifications = document.getElementById('callNotifications').checked;
    appState.settings.smsNotifications = document.getElementById('smsNotifications').checked;
    appState.settings.autoReconnect = document.getElementById('autoReconnect').checked;
    appState.settings.ringtone = document.getElementById('ringtone').value;
    appState.settings.connectionMethod = document.getElementById('connectionMethod').value;
    
    saveSettings();
}

function updateTheme() {
    const theme = document.getElementById('theme').value;
    appState.settings.theme = theme;
    applyTheme(theme);
    saveSettings();
}

function applyTheme(theme) {
    document.body.className = theme;
}

function updateConnectionMethod() {
    updateSettings();
}

function changeConnectionMethod() {
    // Open connection method selector
    alert('تغيير طريقة الاتصال: ' + appState.settings.connectionMethod);
}

function editDevice(id) {
    alert('تعديل الجهاز: ' + id);
}

// Modal Management
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Demo Buttons (for testing)
window.testIncomingCall = simulateIncomingCall;
window.testIncomingSms = simulateIncomingSms;

// Start pairing code timer
function startPairingCodeTimer() {
    generatePairingCode();
}
