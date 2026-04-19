// NOTE: Để thay thế vào project thật, bạn cần tạo project trên Firebase Console và thay đổi config này.
const firebaseConfig = {
    apiKey: "AIzaSyCW0vZX1G3NTKMGNOpA35GDC_RC3EAn2s8",
    authDomain: "demo12-bbb90.firebaseapp.com",
    databaseURL: "https://demo12-bbb90-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "demo12-bbb90",
    storageBucket: "demo12-bbb90.firebasestorage.app",
    messagingSenderId: "1013005010725",
    appId: "1:1013005010725:web:56fcf7844e267aab0c7ccc"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// --- AUTH: Đăng nhập bằng Email/Password ---
window.signInWithEmail = function (event) {
    event.preventDefault();
    const errorEl = document.getElementById('login-error');
    const btnLogin = document.getElementById('btn-email-login');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    errorEl.classList.add('hidden');
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang đăng nhập...</span>';

    auth.signInWithEmailAndPassword(email, password)
        .then((result) => {
            console.log('Đăng nhập Email thành công:', result.user.email);
        })
        .catch((error) => {
            console.error('Lỗi đăng nhập:', error);
            let msg = 'Đăng nhập thất bại!';
            if (error.code === 'auth/user-not-found') msg = 'Email không tồn tại trong hệ thống.';
            else if (error.code === 'auth/wrong-password') msg = 'Mật khẩu không đúng.';
            else if (error.code === 'auth/invalid-email') msg = 'Email không hợp lệ.';
            else if (error.code === 'auth/too-many-requests') msg = 'Quá nhiều lần thử. Vui lòng đợi một lát.';
            else if (error.code === 'auth/invalid-credential') msg = 'Email hoặc mật khẩu không đúng.';
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        })
        .finally(() => {
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span>Đăng Nhập</span>';
        });
};

// --- Toggle hiển thị mật khẩu ---
window.togglePasswordVisibility = function () {
    const passInput = document.getElementById('login-password');
    const eyeIcon = document.getElementById('eye-icon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
};

// --- AUTH: Đăng nhập bằng Google ---
window.signInWithGoogle = function () {
    const errorEl = document.getElementById('login-error');
    errorEl.classList.add('hidden');

    auth.signInWithPopup(googleProvider)
        .then((result) => {
            // Đăng nhập thành công - onAuthStateChanged sẽ xử lý
            console.log('Đăng nhập thành công:', result.user.displayName);
        })
        .catch((error) => {
            console.error('Lỗi đăng nhập:', error);
            errorEl.textContent = `Lỗi: ${error.message}`;
            errorEl.classList.remove('hidden');
        });
};

// --- AUTH: Đăng xuất ---
window.signOutUser = function () {
    auth.signOut()
        .then(() => {
            console.log('Đã đăng xuất');
        })
        .catch((error) => {
            console.error('Lỗi đăng xuất:', error);
        });
};

// --- AUTH: Theo dõi trạng thái đăng nhập ---
let listenersInitialized = false;

auth.onAuthStateChanged((user) => {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    if (user) {
        // Đã đăng nhập - ẩn login, hiện app
        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');

        // Hiển thị thông tin user
        if (userAvatar) userAvatar.src = user.photoURL || '';
        if (userName) userName.textContent = user.displayName || user.email;

        // Chỉ khởi tạo Firebase listeners 1 lần
        if (!listenersInitialized) {
            initFirebaseListeners();
            listenersInitialized = true;
        }
    } else {
        // Chưa đăng nhập - hiện login, ẩn app
        loginScreen.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});


// --- DOM ELEMENTS TABS ---
const navItems = document.querySelectorAll('.nav-links li');
const tabViews = document.querySelectorAll('.tab-view');
const pageTitle = document.getElementById('page-title');

// --- DOM ELEMENTS DATA ---
const elTemp = document.getElementById('temp-val');
const elTempEnv = document.getElementById('temp-val-env');
const elLight = document.getElementById('light-val');
const elLightEnv = document.getElementById('light-val-env');

const elLat = document.getElementById('gps-lat');
const elLng = document.getElementById('gps-lng');
const elSim = document.getElementById('sim-status');
const elLatDetail = document.getElementById('gps-lat-detail');
const elLngDetail = document.getElementById('gps-lng-detail');
const elSimDetail = document.getElementById('sim-status-detail');

const modalAlarm = document.getElementById('fire-alarm-modal');
const modeToggle = document.getElementById('mode-toggle');
const modeLabel = document.getElementById('mode-label');

// --- TABS LOGIC ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class
        navItems.forEach(n => n.classList.remove('active'));
        tabViews.forEach(t => t.classList.remove('active'));

        // Add active class
        item.classList.add('active');
        const tabId = item.getAttribute('data-tab');
        document.getElementById(`view-${tabId}`).classList.add('active');
        pageTitle.innerText = item.innerText;
    });
});

// --- FIREBASE LISTENERS ---
function initFirebaseListeners() {
// Lắng nghe giá trị môi trường
database.ref('sensors').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        if (data.temperature !== undefined) {
            const t = parseFloat(data.temperature).toFixed(1);
            if (elTemp) elTemp.innerText = t;
            if (elTempEnv) elTempEnv.innerText = t;
        }
        if (data.light !== undefined) {
            const l = Math.round(data.light);
            if (elLight) elLight.innerText = l;
            if (elLightEnv) elLightEnv.innerText = l;
        }
    }
});

// Lắng nghe trạng thái GPS & SIM
database.ref('moduleInfo').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        if (data.gps) {
            const lat = data.gps.lat ? parseFloat(data.gps.lat).toFixed(6) : '--.------';
            const lng = data.gps.lng ? parseFloat(data.gps.lng).toFixed(6) : '--.------';
            if (elLat) elLat.innerText = lat;
            if (elLatDetail) elLatDetail.innerText = lat;
            if (elLng) elLng.innerText = lng;
            if (elLngDetail) elLngDetail.innerText = lng;
        }
        if (data.sim) {
            const status = data.sim.status || 'Đã kết nối';
            [elSim, elSimDetail].forEach(el => {
                if (!el) return;
                el.innerText = status;
                if (status === 'Error') {
                    el.style.color = 'var(--acc-red)';
                    el.style.background = 'rgba(239, 68, 68, 0.15)';
                } else {
                    el.style.color = 'var(--acc-blue)';
                    el.style.background = 'rgba(59, 130, 246, 0.15)';
                }
            });
        }
    }
});

// Lắng nghe chế độ (Auto/Manual)
database.ref('settings/mode').on('value', (snapshot) => {
    const mode = snapshot.val(); // 'auto' or 'manual'
    if (mode === 'auto') {
        modeToggle.checked = true;
        modeLabel.innerText = 'Tự Động';
        modeLabel.className = 'mode-label auto';
    } else {
        modeToggle.checked = false;
        modeLabel.innerText = 'Thủ Công';
        modeLabel.className = 'mode-label manual';
    }
});

// Lắng nghe trạng thái đèn
const rooms = ['living', 'bed1', 'kitchen', 'bath'];
rooms.forEach(room => {
    database.ref(`lights/${room}`).on('value', (snapshot) => {
        const val = snapshot.val();
        if (val !== null) {
            const toggle = document.getElementById(`toggle-${room}`);
            const card = document.getElementById(`room-${room}`);
            if (toggle) toggle.checked = val;
            if (card) {
                if (val) card.classList.add('active');
                else card.classList.remove('active');
            }
        }
    });
});

// Lắng nghe báo cháy
database.ref('alarm/fire').on('value', (snapshot) => {
    const isFire = snapshot.val();
    if (isFire) triggerFireAlarm();
    else stopFireAlarm();
});
} // end initFirebaseListeners

// Gửi chế độ lên Firebase
window.toggleSystemMode = function () {
    const isAuto = modeToggle.checked;
    const newMode = isAuto ? 'auto' : 'manual';
    database.ref('settings/mode').set(newMode);
};

window.toggleLight = function (roomId) {
    if (modeToggle.checked) {
        alert("Hệ thống đang ở Chế độ Tự Động.\nBạn không thể điều khiển bằng tay. Hãy tắt Chế độ Tự Động trước!");
        // revert UI
        const toggle = document.getElementById(`toggle-${roomId}`);
        toggle.checked = !toggle.checked;
        return;
    }

    const toggle = document.getElementById(`toggle-${roomId}`);
    const card = document.getElementById(`room-${roomId}`);
    const isChecked = toggle.checked;

    // Giao diện thay đổi tức thì cho phản hồi nhanh
    if (isChecked) card.classList.add('active');
    else card.classList.remove('active');

    // Cập nhật Firebase
    database.ref(`lights/${roomId}`).set(isChecked);
};

function triggerFireAlarm() {
    document.body.classList.add('fire-active');
    modalAlarm.classList.remove('hidden');
}

function stopFireAlarm() {
    document.body.classList.remove('fire-active');
    modalAlarm.classList.add('hidden');
}

window.acknowledgeAlarm = function () {
    database.ref('alarm/fire').set(false);
};
