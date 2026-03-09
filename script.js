// --- MOCK DATABASE (Stored in localStorage for persistence) ---
const DEPARTMENTS = [
    { id: "library", name: "University Library", desc: "Return all borrowed books and pay overdue fines." },
    { id: "finance", name: "Bursary & Finance", desc: "Clear all outstanding tuition and accommodation fees." },
    { id: "academic", name: "Academic Department", desc: "Submit project copy and clear departmental dues." }
];

const INIT_DATA = {
    users: [
        { id: "ADMIN-1", role: "admin", name: "System Admin", password: "pass123" },
        { id: "STAFF-LIB", role: "staff", name: "Library Head", deptHandle: "library", password: "pass123" },
        { id: "STAFF-FIN", role: "staff", name: "Bursar Officer", deptHandle: "finance", password: "pass123" },
        { id: "STAFF-ACA", role: "staff", name: "Academic Head", deptHandle: "academic", password: "pass123" },
        { id: "STU-1234", role: "student", name: "Alex Johnson", department: "Computer Science", password: "pass123", registrarCleared: false },
        { id: "STU-5678", role: "student", name: "Maria Garcia", department: "Engineering", password: "pass123", registrarCleared: false }
    ],
    // clearance requests mapping: { id, studentId, deptId, status, remarks, date }
    // statuses: 'pending', 'cleared', 'rejected'
    clearances: [
        { id: "REQ-1", studentId: "STU-1234", deptId: "library", status: "pending", remarks: "", date: "" },
        { id: "REQ-2", studentId: "STU-1234", deptId: "academic", status: "cleared", remarks: "Project submitted.", date: "2023-10-15" }
    ]
};

// Initialize DB
if (!localStorage.getItem('clearflow_db')) {
    localStorage.setItem('clearflow_db', JSON.stringify(INIT_DATA));
}
let db = JSON.parse(localStorage.getItem('clearflow_db'));

function saveDb() {
    localStorage.setItem('clearflow_db', JSON.stringify(db));
}

// Current Session State
let currentUser = null;

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const studentDash = document.getElementById('student-dashboard');
const staffDash = document.getElementById('staff-dashboard');
const adminDash = document.getElementById('admin-dashboard');

const loginForm = document.getElementById('login-form');
const logoutBtns = document.querySelectorAll('.logout-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize App on Load
document.addEventListener('DOMContentLoaded', () => {
    const session = sessionStorage.getItem('clearflow_session');
    if (session) {
        currentUser = JSON.parse(session);
        routeDashboard();
    }
});

// --- AUTHENTICATION ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.getElementById('role').value;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Find user
    const user = db.users.find(u => u.id === username && u.role === role && u.password === password);
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('clearflow_session', JSON.stringify(user));
        showToast("Login successful.");
        loginForm.reset();
        routeDashboard();
    } else {
        alert("Invalid credentials or role mismatch.");
    }
});

logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sessionStorage.removeItem('clearflow_session');
        currentUser = null;
        [studentDash, staffDash, adminDash].forEach(d => d.classList.add('hidden'));
        authScreen.classList.remove('hidden');
    });
});

function routeDashboard() {
    authScreen.classList.add('hidden');
    
    if (currentUser.role === 'admin') {
        adminDash.classList.remove('hidden');
        renderAdminDash();
    } else if (currentUser.role === 'staff') {
        staffDash.classList.remove('hidden');
        renderStaffDash();
    } else if (currentUser.role === 'student') {
        studentDash.classList.remove('hidden');
        renderStudentDash();
    }
}

// --- UTILS ---
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Modals
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ---------------------------
// ADMIN DASHBOARD
// ---------------------------
const btnShowStudents = document.getElementById('show-students-btn');
const btnShowStaff = document.getElementById('show-staff-btn');
const divStudents = document.getElementById('admin-students');
const divStaff = document.getElementById('admin-staff');

btnShowStudents.addEventListener('click', () => {
    divStudents.classList.remove('hidden');
    divStaff.classList.add('hidden');
    btnShowStudents.classList.remove('btn-secondary');
    btnShowStaff.classList.add('btn-secondary');
});

btnShowStaff.addEventListener('click', () => {
    divStaff.classList.remove('hidden');
    divStudents.classList.add('hidden');
    btnShowStaff.classList.remove('btn-secondary');
    btnShowStudents.classList.add('btn-secondary');
});

function renderAdminDash() {
    // Render Students
    const stuTbody = document.getElementById('admin-students-tbody');
    stuTbody.innerHTML = '';
    const students = db.users.filter(u => u.role === 'student');
    
    students.forEach(stu => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stu.id}</td>
            <td>${stu.name}</td>
            <td>${stu.department}</td>
            <td>${stu.password}</td>
            <td>
                <button class="btn btn-small" onclick="editUser('${stu.id}', 'student')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteUser('${stu.id}')">Delete</button>
            </td>
        `;
        stuTbody.appendChild(tr);
    });

    // Render Staff
    const staffTbody = document.getElementById('admin-staff-tbody');
    staffTbody.innerHTML = '';
    const staffs = db.users.filter(u => u.role === 'staff');

    staffs.forEach(stf => {
        // Map dept id to generic string if needed, or keep raw
        let deptName = DEPARTMENTS.find(d => d.id === stf.deptHandle)?.name || stf.deptHandle;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stf.id}</td>
            <td>${stf.name}</td>
            <td>${deptName}</td>
            <td>${stf.password}</td>
            <td>
                <button class="btn btn-small" onclick="editUser('${stf.id}', 'staff')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteUser('${stf.id}')">Delete</button>
            </td>
        `;
        staffTbody.appendChild(tr);
    });
}

function showAddUserModal(role) {
    document.getElementById('modal-title').textContent = role === 'student' ? 'Add Student' : 'Add Staff';
    document.getElementById('modal-action-type').value = 'add';
    document.getElementById('modal-user-role').value = role;
    
    document.getElementById('m-userid').value = '';
    document.getElementById('m-name').value = '';
    document.getElementById('m-dept').value = '';
    document.getElementById('m-password').value = '';

    document.querySelector('label[for="m-dept"]').textContent = role === 'student' ? "Department" : "Handled Dept (e.g., library, finance)";
    
    openModal('user-modal');
}

function editUser(id, role) {
    const user = db.users.find(u => u.id === id);
    if(!user) return;

    document.getElementById('modal-title').textContent = role === 'student' ? 'Edit Student' : 'Edit Staff';
    document.getElementById('modal-action-type').value = 'edit';
    document.getElementById('modal-user-role').value = role;
    document.getElementById('modal-original-id').value = id;

    document.getElementById('m-userid').value = user.id;
    document.getElementById('m-name').value = user.name;
    document.getElementById('m-dept').value = role === 'student' ? user.department : user.deptHandle;
    document.getElementById('m-password').value = user.password;

    document.querySelector('label[for="m-dept"]').textContent = role === 'student' ? "Department" : "Handled Dept (e.g., library, finance)";
    
    openModal('user-modal');
}

document.getElementById('user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const action = document.getElementById('modal-action-type').value;
    const role = document.getElementById('modal-user-role').value;
    const origId = document.getElementById('modal-original-id').value;

    const newId = document.getElementById('m-userid').value.trim();
    const newName = document.getElementById('m-name').value.trim();
    const newDept = document.getElementById('m-dept').value.trim();
    const newPass = document.getElementById('m-password').value;

    if (action === 'add') {
        const exists = db.users.find(u => u.id === newId);
        if(exists) return alert("User ID already exists.");
        
        const newUser = { id: newId, role: role, name: newName, password: newPass };
        if(role === 'student') {
            newUser.department = newDept;
            newUser.registrarCleared = false;
        } else {
            newUser.deptHandle = newDept;
        }
        db.users.push(newUser);
        showToast("User added.");
    } else {
        // Edit mode
        const index = db.users.findIndex(u => u.id === origId);
        if(index > -1) {
            db.users[index].id = newId;
            db.users[index].name = newName;
            db.users[index].password = newPass;
            if(role === 'student') db.users[index].department = newDept;
            else db.users[index].deptHandle = newDept;
        }
        showToast("User updated.");
    }
    
    saveDb();
    closeModal('user-modal');
    renderAdminDash();
});

window.deleteUser = function(id) {
    if(confirm("Are you sure you want to delete this user?")) {
        db.users = db.users.filter(u => u.id !== id);
        saveDb();
        renderAdminDash();
        showToast("User deleted.");
    }
};

// ---------------------------
// STAFF DASHBOARD
// ---------------------------
function renderStaffDash() {
    const deptInfo = DEPARTMENTS.find(d => d.id === currentUser.deptHandle);
    document.getElementById('staff-name').textContent = currentUser.name;
    document.getElementById('staff-dept-name').textContent = deptInfo ? deptInfo.name : currentUser.deptHandle;

    const tbody = document.getElementById('requests-tbody');
    tbody.innerHTML = '';

    // Find all clearance requests directed to this staff's department
    const reqs = db.clearances.filter(req => req.deptId === currentUser.deptHandle);

    if(reqs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="center">No requests found.</td></tr>`;
        return;
    }

    reqs.forEach(req => {
        const stu = db.users.find(u => u.id === req.studentId);
        const stuName = stu ? stu.name : 'Unknown';
        
        let statusSpan = '';
        if(req.status === 'cleared') statusSpan = '<span class="status-cleared">Cleared</span>';
        else if(req.status === 'rejected') statusSpan = '<span class="status-rejected">Rejected</span>';
        else statusSpan = '<span class="status-pending">Pending</span>';

        let actionHtml = '';
        if(req.status === 'pending') {
            actionHtml = `<button class="btn btn-small" onclick="openStaffAction('${req.id}', '${req.studentId}')">Review</button>`;
        } else {
            actionHtml = `<span style="color:#888; font-size:12px;">Processed on ${req.date}</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.studentId}</td>
            <td>${stuName}</td>
            <td>${statusSpan}</td>
            <td>${req.remarks || '-'}</td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.openStaffAction = function(reqId, stuId) {
    document.getElementById('action-req-id').value = reqId;
    document.getElementById('action-student-id').textContent = stuId;
    document.getElementById('action-remarks').value = '';
    openModal('staff-action-modal');
};

window.submitStaffAction = function(decision) {
    const reqId = document.getElementById('action-req-id').value;
    const remarks = document.getElementById('action-remarks').value.trim();

    if(decision === 'rejected' && remarks === '') {
        alert("Remarks are required to reject a clearance.");
        return;
    }

    const reqIdx = db.clearances.findIndex(r => r.id === reqId);
    if(reqIdx > -1) {
        db.clearances[reqIdx].status = decision;
        db.clearances[reqIdx].remarks = remarks;
        db.clearances[reqIdx].date = getTodayStr();
        saveDb();
        showToast(`Request ${decision}.`);
        closeModal('staff-action-modal');
        renderStaffDash();
    }
};

// ---------------------------
// STUDENT DASHBOARD
// ---------------------------
function renderStudentDash() {
    // Refresh student data from db in case it updated
    currentUser = db.users.find(u => u.id === currentUser.id);

    document.getElementById('student-name').textContent = currentUser.name;
    document.getElementById('student-dept').textContent = currentUser.department;

    const list = document.getElementById('departments-list');
    list.innerHTML = '';
    
    let totalDepts = DEPARTMENTS.length;
    let clearedCount = 0;

    DEPARTMENTS.forEach(dept => {
        // Find existing request for this dept
        const req = db.clearances.find(r => r.studentId === currentUser.id && r.deptId === dept.id);
        
        const card = document.createElement('div');
        card.className = 'dept-card';
        
        let statusHtml = '';
        
        if (!req) {
            // Not requested yet
            statusHtml = `
                <div class="status-pending" style="color:#666;">Not Requested</div>
                <button class="btn btn-small" onclick="requestStudentClearance('${dept.id}')" style="margin-top:5px;">Request Clearance</button>
            `;
        } else {
            if (req.status === 'cleared') {
                clearedCount++;
                statusHtml = `
                    <div class="status-cleared">Cleared (${req.date})</div>
                    ${req.remarks ? `<div class="remarks-text">Remark: ${req.remarks}</div>` : ''}
                `;
            } else if (req.status === 'rejected') {
                statusHtml = `
                    <div class="status-rejected">Rejected</div>
                    <div class="remarks-text" style="border-color:#dc3545;"><strong>Reason:</strong> ${req.remarks}</div>
                    <button class="btn btn-small" onclick="requestStudentClearance('${dept.id}', true)" style="margin-top:8px;">Re-Request</button>
                `;
            } else {
                statusHtml = `
                    <div class="status-pending">Pending Staff Review</div>
                `;
            }
        }

        card.innerHTML = `
            <div class="dept-info">
                <h4>${dept.name}</h4>
                <p>${dept.desc}</p>
            </div>
            <div class="dept-status">
                ${statusHtml}
            </div>
        `;
        
        list.appendChild(card);
    });

    // Overall Progress
    const percentage = Math.round((clearedCount / totalDepts) * 100);
    const progressBar = document.getElementById('overall-progress');
    const progressText = document.getElementById('progress-percentage');
    const statusBadge = document.getElementById('overall-statusBadge');
    const subBtn = document.getElementById('submit-registrar-btn');
    const regPanel = document.getElementById('registrar-panel');
    
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}%`;
    
    if(currentUser.registrarCleared) {
        statusBadge.textContent = 'Fully Completed';
        statusBadge.className = 'status-cleared';
        regPanel.innerHTML = `
            <div style="background:#d4edda; color:#155724; padding:20px; border-radius:4px; border:1px solid #c3e6cb;">
                <h3><i class="fa-solid fa-check-circle"></i> Successfully Cleared</h3>
                <p>Congratulations, your file has been submitted to the Registrar. You are fully cleared.</p>
            </div>
        `;
    } else {
        // Reset the panel in case another student was previously loaded
        regPanel.innerHTML = `
            <h3>Final Action: Registrar Submission</h3>
            <p>Once all departments clear you, you can submit your final file to the Registrar.</p>
            <button id="submit-registrar-btn" class="btn disabled" disabled>
                Submit to Registrar
            </button>
        `;
        // Re-attach the subBtn reference since we just overwrote the HTML
        const subBtn = document.getElementById('submit-registrar-btn');

        if (percentage === 100) {
            statusBadge.textContent = 'Ready for Final Submission';
            statusBadge.style.color = '#0056b3';
            subBtn.classList.remove('disabled');
            subBtn.disabled = false;
        } else {
            statusBadge.textContent = 'In Progress';
            statusBadge.style.color = 'inherit';
            subBtn.classList.add('disabled');
            subBtn.disabled = true;
        }

        // Re-attach event listener to the newly created button
        attachRegistrarListener();
    }
}

window.requestStudentClearance = function(deptId, isReRequest = false) {
    if(isReRequest) {
        // delete old request so we make a fresh one
        db.clearances = db.clearances.filter(r => !(r.studentId === currentUser.id && r.deptId === deptId));
    }

    const newReq = {
        id: "REQ-" + generateId(),
        studentId: currentUser.id,
        deptId: deptId,
        status: "pending",
        remarks: "",
        date: ""
    };

    db.clearances.push(newReq);
    saveDb();
    showToast("Clearance request sent.");
    renderStudentDash();
};

function attachRegistrarListener() {
    const btn = document.getElementById('submit-registrar-btn');
    if(btn) {
        // Need to remove previous listener if any by recreating, or just binding it properly
        btn.onclick = () => {
            const idx = db.users.findIndex(u => u.id === currentUser.id);
            if(idx > -1) {
                db.users[idx].registrarCleared = true;
                saveDb();
                showToast("Successfully Submitted to Registrar!");
                renderStudentDash();
            }
        };
    }
}
