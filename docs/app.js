// ===== DATA LAYER (localStorage) =====
function getData(key) {
    return JSON.parse(localStorage.getItem('qc_' + key) || '[]');
}
function setData(key, data) {
    localStorage.setItem('qc_' + key, JSON.stringify(data));
}
function nextId(key) {
    const items = getData(key);
    return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

// ===== TOAST =====
function showToast(msg, type) {
    const container = document.getElementById('toastContainer');
    const cls = type === 'success' ? 'bg-success' : 'bg-danger';
    const el = document.createElement('div');
    el.className = `toast show align-items-center text-white ${cls} border-0 mb-2`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button></div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ===== NAVIGATION =====
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    const nav = document.getElementById('nav-' + name);
    if (nav) nav.classList.add('active');

    if (name === 'record') initRecordPage();
    if (name === 'records') { initFilterDate(); loadRecords(); }
    if (name === 'settings') renderSettings();
    if (name === 'summary') { initSummaryDates(); loadSummary(); }
}

// ===== SETTINGS: MACHINES =====
function addMachine(e) {
    e.preventDefault();
    const no = document.getElementById('newMachineNo').value.trim();
    const name = document.getElementById('newMachineName').value.trim();
    const machines = getData('machines');
    if (machines.find(m => m.machine_no === no)) { showToast('หมายเลขเครื่องจักรนี้มีอยู่แล้ว', 'danger'); return false; }
    machines.push({ id: nextId('machines'), machine_no: no, machine_name: name, is_active: true });
    setData('machines', machines);
    document.getElementById('newMachineNo').value = '';
    document.getElementById('newMachineName').value = '';
    showToast('เพิ่มเครื่องจักรสำเร็จ', 'success');
    renderSettings();
    return false;
}
function toggleMachine(id) {
    const machines = getData('machines');
    const m = machines.find(x => x.id === id);
    if (m) m.is_active = !m.is_active;
    setData('machines', machines);
    renderSettings();
}
function openEditMachine(id) {
    const m = getData('machines').find(x => x.id === id);
    document.getElementById('editMachineId').value = id;
    document.getElementById('editMachineNo').value = m.machine_no;
    document.getElementById('editMachineName').value = m.machine_name || '';
    new bootstrap.Modal(document.getElementById('editMachineModal')).show();
}
function saveMachineEdit() {
    const id = parseInt(document.getElementById('editMachineId').value);
    const no = document.getElementById('editMachineNo').value.trim();
    const name = document.getElementById('editMachineName').value.trim();
    const machines = getData('machines');
    if (machines.find(m => m.machine_no === no && m.id !== id)) { showToast('หมายเลขเครื่องจักรนี้มีอยู่แล้ว', 'danger'); return; }
    const m = machines.find(x => x.id === id);
    m.machine_no = no; m.machine_name = name;
    setData('machines', machines);
    bootstrap.Modal.getInstance(document.getElementById('editMachineModal')).hide();
    showToast('แก้ไขเครื่องจักรสำเร็จ', 'success');
    renderSettings();
}

// ===== SETTINGS: PRODUCTS =====
function addProduct(e) {
    e.preventDefault();
    const name = document.getElementById('newProductName').value.trim();
    const target = parseFloat(document.getElementById('newProductTarget').value);
    const min = parseFloat(document.getElementById('newProductMin').value);
    const max = parseFloat(document.getElementById('newProductMax').value);
    const unit = document.getElementById('newProductUnit').value.trim() || 'กรัม';
    const products = getData('products');
    if (products.find(p => p.name === name)) { showToast('ชื่อสินค้านี้มีอยู่แล้ว', 'danger'); return false; }
    products.push({ id: nextId('products'), name, target_weight: target, min_weight: min, max_weight: max, unit });
    setData('products', products);
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductTarget').value = '';
    document.getElementById('newProductMin').value = '';
    document.getElementById('newProductMax').value = '';
    document.getElementById('newProductUnit').value = '';
    showToast('เพิ่มสินค้าสำเร็จ', 'success');
    renderSettings();
    return false;
}
function openEditProduct(id) {
    const p = getData('products').find(x => x.id === id);
    document.getElementById('editProductId').value = id;
    document.getElementById('editProductName').value = p.name;
    document.getElementById('editProductTarget').value = p.target_weight;
    document.getElementById('editProductMin').value = p.min_weight;
    document.getElementById('editProductMax').value = p.max_weight;
    document.getElementById('editProductUnit').value = p.unit;
    new bootstrap.Modal(document.getElementById('editProductModal')).show();
}
function saveProductEdit() {
    const id = parseInt(document.getElementById('editProductId').value);
    const name = document.getElementById('editProductName').value.trim();
    const products = getData('products');
    if (products.find(p => p.name === name && p.id !== id)) { showToast('ชื่อสินค้านี้มีอยู่แล้ว', 'danger'); return; }
    const p = products.find(x => x.id === id);
    p.name = name;
    p.target_weight = parseFloat(document.getElementById('editProductTarget').value);
    p.min_weight = parseFloat(document.getElementById('editProductMin').value);
    p.max_weight = parseFloat(document.getElementById('editProductMax').value);
    p.unit = document.getElementById('editProductUnit').value.trim() || 'กรัม';
    setData('products', products);
    bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
    showToast('แก้ไขสินค้าสำเร็จ', 'success');
    renderSettings();
}

// ===== SETTINGS: OPERATORS =====
function addOperator(e) {
    e.preventDefault();
    const name = document.getElementById('newOperatorName').value.trim();
    const empId = document.getElementById('newOperatorEmpId').value.trim();
    const operators = getData('operators');
    if (operators.find(o => o.name === name)) { showToast('ชื่อพนักงานนี้มีอยู่แล้ว', 'danger'); return false; }
    operators.push({ id: nextId('operators'), name, employee_id: empId, is_active: true });
    setData('operators', operators);
    document.getElementById('newOperatorName').value = '';
    document.getElementById('newOperatorEmpId').value = '';
    showToast('เพิ่มพนักงานคุมเครื่องสำเร็จ', 'success');
    renderSettings();
    return false;
}
function toggleOperator(id) {
    const operators = getData('operators');
    const o = operators.find(x => x.id === id);
    if (o) o.is_active = !o.is_active;
    setData('operators', operators);
    renderSettings();
}
function openEditOperator(id) {
    const o = getData('operators').find(x => x.id === id);
    document.getElementById('editOperatorId').value = id;
    document.getElementById('editOperatorName').value = o.name;
    document.getElementById('editOperatorEmpId').value = o.employee_id || '';
    new bootstrap.Modal(document.getElementById('editOperatorModal')).show();
}
function saveOperatorEdit() {
    const id = parseInt(document.getElementById('editOperatorId').value);
    const name = document.getElementById('editOperatorName').value.trim();
    const operators = getData('operators');
    if (operators.find(o => o.name === name && o.id !== id)) { showToast('ชื่อพนักงานนี้มีอยู่แล้ว', 'danger'); return; }
    const o = operators.find(x => x.id === id);
    o.name = name;
    o.employee_id = document.getElementById('editOperatorEmpId').value.trim();
    setData('operators', operators);
    bootstrap.Modal.getInstance(document.getElementById('editOperatorModal')).hide();
    showToast('แก้ไขพนักงานคุมเครื่องสำเร็จ', 'success');
    renderSettings();
}

// ===== SETTINGS: QC =====
function addQC(e) {
    e.preventDefault();
    const name = document.getElementById('newQCName').value.trim();
    const empId = document.getElementById('newQCEmpId').value.trim();
    const qcs = getData('qc_inspectors');
    if (qcs.find(q => q.name === name)) { showToast('ชื่อ QC นี้มีอยู่แล้ว', 'danger'); return false; }
    qcs.push({ id: nextId('qc_inspectors'), name, employee_id: empId, is_active: true });
    setData('qc_inspectors', qcs);
    document.getElementById('newQCName').value = '';
    document.getElementById('newQCEmpId').value = '';
    showToast('เพิ่ม QC สำเร็จ', 'success');
    renderSettings();
    return false;
}
function toggleQC(id) {
    const qcs = getData('qc_inspectors');
    const q = qcs.find(x => x.id === id);
    if (q) q.is_active = !q.is_active;
    setData('qc_inspectors', qcs);
    renderSettings();
}
function openEditQC(id) {
    const q = getData('qc_inspectors').find(x => x.id === id);
    document.getElementById('editQCId').value = id;
    document.getElementById('editQCNameField').value = q.name;
    document.getElementById('editQCEmpId').value = q.employee_id || '';
    new bootstrap.Modal(document.getElementById('editQCModal')).show();
}
function saveQCEdit() {
    const id = parseInt(document.getElementById('editQCId').value);
    const name = document.getElementById('editQCNameField').value.trim();
    const qcs = getData('qc_inspectors');
    if (qcs.find(q => q.name === name && q.id !== id)) { showToast('ชื่อ QC นี้มีอยู่แล้ว', 'danger'); return; }
    const q = qcs.find(x => x.id === id);
    q.name = name;
    q.employee_id = document.getElementById('editQCEmpId').value.trim();
    setData('qc_inspectors', qcs);
    bootstrap.Modal.getInstance(document.getElementById('editQCModal')).hide();
    showToast('แก้ไข QC สำเร็จ', 'success');
    renderSettings();
}

// ===== RENDER SETTINGS =====
function renderSettings() {
    const machines = getData('machines');
    const products = getData('products');
    const operators = getData('operators');
    const qcs = getData('qc_inspectors');

    document.getElementById('machinesTable').innerHTML = machines.length ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0">
        <thead class="table-light"><tr><th>เลขเครื่อง</th><th>ชื่อ</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${machines.map(m => `<tr class="${m.is_active ? '' : 'text-muted'}">
            <td>${esc(m.machine_no)}</td><td>${esc(m.machine_name || '-')}</td>
            <td>${m.is_active ? '<span class="badge bg-success">ใช้งาน</span>' : '<span class="badge bg-secondary">ปิดใช้งาน</span>'}</td>
            <td class="text-nowrap"><button class="btn btn-sm btn-outline-warning" onclick="openEditMachine(${m.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleMachine(${m.id})"><i class="bi bi-toggle-${m.is_active ? 'on' : 'off'}"></i></button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="text-muted text-center py-2">ยังไม่มีข้อมูล</p>';

    document.getElementById('productsTable').innerHTML = products.length ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0">
        <thead class="table-light"><tr><th>สินค้า</th><th>เป้า</th><th>ต่ำสุด</th><th>สูงสุด</th><th>หน่วย</th><th></th></tr></thead>
        <tbody>${products.map(p => `<tr>
            <td>${esc(p.name)}</td><td>${p.target_weight}</td><td>${p.min_weight}</td><td>${p.max_weight}</td><td>${esc(p.unit)}</td>
            <td><button class="btn btn-sm btn-outline-warning" onclick="openEditProduct(${p.id})"><i class="bi bi-pencil"></i></button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="text-muted text-center py-2">ยังไม่มีข้อมูล</p>';

    document.getElementById('operatorsTable').innerHTML = operators.length ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0">
        <thead class="table-light"><tr><th>ชื่อ</th><th>รหัส</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${operators.map(o => `<tr class="${o.is_active ? '' : 'text-muted'}">
            <td>${esc(o.name)}</td><td>${esc(o.employee_id || '-')}</td>
            <td>${o.is_active ? '<span class="badge bg-success">ใช้งาน</span>' : '<span class="badge bg-secondary">ปิดใช้งาน</span>'}</td>
            <td class="text-nowrap"><button class="btn btn-sm btn-outline-warning" onclick="openEditOperator(${o.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleOperator(${o.id})"><i class="bi bi-toggle-${o.is_active ? 'on' : 'off'}"></i></button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="text-muted text-center py-2">ยังไม่มีข้อมูล</p>';

    document.getElementById('qcTable').innerHTML = qcs.length ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0">
        <thead class="table-light"><tr><th>ชื่อ</th><th>รหัส</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${qcs.map(q => `<tr class="${q.is_active ? '' : 'text-muted'}">
            <td>${esc(q.name)}</td><td>${esc(q.employee_id || '-')}</td>
            <td>${q.is_active ? '<span class="badge bg-success">ใช้งาน</span>' : '<span class="badge bg-secondary">ปิดใช้งาน</span>'}</td>
            <td class="text-nowrap"><button class="btn btn-sm btn-outline-warning" onclick="openEditQC(${q.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleQC(${q.id})"><i class="bi bi-toggle-${q.is_active ? 'on' : 'off'}"></i></button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="text-muted text-center py-2">ยังไม่มีข้อมูล</p>';
}

// ===== RECORD PAGE =====
function initRecordPage() {
    const now = new Date();
    document.getElementById('checkDate').value = now.toISOString().slice(0, 10);
    const hourSel = document.getElementById('checkHour');
    hourSel.innerHTML = '';
    for (let h = 0; h < 24; h++) {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = `${String(h).padStart(2, '0')}:00 - ${String(h < 23 ? h + 1 : 0).padStart(2, '0')}:00 น.`;
        if (h === now.getHours()) opt.selected = true;
        hourSel.appendChild(opt);
    }
    populateDropdowns();
    document.getElementById('machineId').onchange = loadPreviousRecord;
    document.getElementById('checkDate').onchange = loadPreviousRecord;
    document.getElementById('checkHour').onchange = loadPreviousRecord;
    document.getElementById('productId').onchange = loadProductSpec;
    document.getElementById('weightInput').oninput = checkWeight;
    document.getElementById('prevInfo').classList.add('d-none');
    document.getElementById('specInfo').style.display = 'none';
    document.getElementById('weightResult').style.display = 'none';
    document.getElementById('weightInput').value = '';
    document.getElementById('noteInput').value = '';
}

function populateDropdowns() {
    const machines = getData('machines').filter(m => m.is_active);
    const operators = getData('operators').filter(o => o.is_active);
    const qcs = getData('qc_inspectors').filter(q => q.is_active);
    const products = getData('products');

    const mSel = document.getElementById('machineId');
    mSel.innerHTML = '<option value="">-- เลือกเครื่องจักร --</option>' +
        machines.map(m => `<option value="${m.id}">${esc(m.machine_no)}${m.machine_name ? ' - ' + esc(m.machine_name) : ''}</option>`).join('');

    const pSel = document.getElementById('productId');
    pSel.innerHTML = '<option value="">-- เลือกสินค้า --</option>' +
        products.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

    const oSel = document.getElementById('operatorId');
    oSel.innerHTML = '<option value="">-- เลือกพนักงาน --</option>' +
        operators.map(o => `<option value="${o.id}">${esc(o.name)}${o.employee_id ? ' (' + esc(o.employee_id) + ')' : ''}</option>`).join('');

    const qSel = document.getElementById('qcId');
    qSel.innerHTML = '<option value="">-- เลือก QC --</option>' +
        qcs.map(q => `<option value="${q.id}">${esc(q.name)}${q.employee_id ? ' (' + esc(q.employee_id) + ')' : ''}</option>`).join('');
}

function loadPreviousRecord() {
    const machineId = parseInt(document.getElementById('machineId').value);
    const checkDate = document.getElementById('checkDate').value;
    const checkHour = parseInt(document.getElementById('checkHour').value);
    const prevInfo = document.getElementById('prevInfo');

    if (!machineId || !checkDate) { prevInfo.classList.add('d-none'); return; }

    let prevHour = checkHour - 1;
    let prevDate = checkDate;
    if (prevHour < 0) {
        prevHour = 23;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        prevDate = d.toISOString().slice(0, 10);
    }

    const records = getData('records');
    const prev = records.filter(r => r.machine_id === machineId && r.check_date === prevDate && r.check_hour === prevHour);
    const record = prev.length ? prev[prev.length - 1] : null;

    if (record) {
        const operators = getData('operators');
        const qcs = getData('qc_inspectors');
        const products = getData('products');
        const op = operators.find(o => o.id === record.operator_id);
        const qc = qcs.find(q => q.id === record.qc_id);
        const pr = products.find(p => p.id === record.product_id);

        prevInfo.classList.remove('d-none');
        document.getElementById('prevOperator').textContent = op ? op.name : '-';
        document.getElementById('prevQC').textContent = qc ? qc.name : '-';
        document.getElementById('prevWeight').textContent = record.weight;
        const statusEl = document.getElementById('prevStatus');
        statusEl.textContent = record.status;
        statusEl.className = 'badge ' + (record.status === 'ผ่าน' ? 'bg-success' : 'bg-danger');

        document.getElementById('operatorId').value = record.operator_id;
        document.getElementById('qcId').value = record.qc_id;
        document.getElementById('productId').value = record.product_id;
        loadProductSpec();
    } else {
        prevInfo.classList.add('d-none');
    }
}

let currentSpec = null;
function loadProductSpec() {
    const productId = parseInt(document.getElementById('productId').value);
    const specInfo = document.getElementById('specInfo');
    if (!productId) { specInfo.style.display = 'none'; currentSpec = null; return; }
    const product = getData('products').find(p => p.id === productId);
    if (product) {
        currentSpec = product;
        document.getElementById('specTarget').textContent = product.target_weight;
        document.getElementById('specMin').textContent = product.min_weight;
        document.getElementById('specMax').textContent = product.max_weight;
        document.getElementById('specUnit').textContent = product.unit;
        document.getElementById('weightUnit').textContent = product.unit;
        specInfo.style.display = 'block';
        checkWeight();
    }
}

function checkWeight() {
    const weight = parseFloat(document.getElementById('weightInput').value);
    const resultDiv = document.getElementById('weightResult');
    const alertDiv = document.getElementById('weightAlert');
    const statusText = document.getElementById('weightStatus');
    if (!currentSpec || isNaN(weight)) { resultDiv.style.display = 'none'; return; }
    resultDiv.style.display = 'block';
    if (weight < currentSpec.min_weight) {
        alertDiv.className = 'alert alert-danger py-2 mb-0';
        statusText.textContent = `ต่ำกว่าเกณฑ์ (ต่ำกว่า ${currentSpec.min_weight} ${currentSpec.unit})`;
    } else if (weight > currentSpec.max_weight) {
        alertDiv.className = 'alert alert-danger py-2 mb-0';
        statusText.textContent = `เกินเกณฑ์ (เกิน ${currentSpec.max_weight} ${currentSpec.unit})`;
    } else {
        alertDiv.className = 'alert alert-success py-2 mb-0';
        statusText.textContent = 'ผ่านเกณฑ์';
    }
}

function determineStatus(weight, min, max) {
    if (weight < min) return 'ต่ำกว่าเกณฑ์';
    if (weight > max) return 'เกินเกณฑ์';
    return 'ผ่าน';
}

function saveRecord(e) {
    e.preventDefault();
    const machineId = parseInt(document.getElementById('machineId').value);
    const productId = parseInt(document.getElementById('productId').value);
    const operatorId = parseInt(document.getElementById('operatorId').value);
    const qcId = parseInt(document.getElementById('qcId').value);
    const weight = parseFloat(document.getElementById('weightInput').value);
    const checkDate = document.getElementById('checkDate').value;
    const checkHour = parseInt(document.getElementById('checkHour').value);
    const note = document.getElementById('noteInput').value.trim();

    const product = getData('products').find(p => p.id === productId);
    const status = determineStatus(weight, product.min_weight, product.max_weight);

    const records = getData('records');
    records.push({
        id: nextId('records'), machine_id: machineId, operator_id: operatorId, qc_id: qcId,
        product_id: productId, weight, status, check_date: checkDate, check_hour: checkHour,
        note, created_at: new Date().toISOString()
    });
    setData('records', records);

    const cls = status === 'ผ่าน' ? 'success' : 'danger';
    showToast(`บันทึกสำเร็จ - สถานะ: ${status}`, cls);
    document.getElementById('weightInput').value = '';
    document.getElementById('noteInput').value = '';
    document.getElementById('weightResult').style.display = 'none';
    return false;
}

// ===== RECORDS LIST =====
function initFilterDate() {
    document.getElementById('filterDate').value = new Date().toISOString().slice(0, 10);
    const hSel = document.getElementById('filterHour');
    if (hSel.children.length <= 1) {
        hSel.innerHTML = '<option value="">-- ทุกชั่วโมง --</option>';
        for (let h = 0; h < 24; h++) {
            hSel.innerHTML += `<option value="${h}">${String(h).padStart(2, '0')}:00 น.</option>`;
        }
    }
}

function loadRecords() {
    const date = document.getElementById('filterDate').value;
    const hour = document.getElementById('filterHour').value;
    const records = getData('records');
    const machines = getData('machines');
    const operators = getData('operators');
    const qcs = getData('qc_inspectors');
    const products = getData('products');

    let filtered = records.filter(r => r.check_date === date);
    if (hour !== '') filtered = filtered.filter(r => r.check_hour === parseInt(hour));
    filtered.sort((a, b) => b.check_hour - a.check_hour || a.machine_id - b.machine_id);

    const container = document.getElementById('recordsTableContainer');
    if (!filtered.length) {
        container.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-inbox" style="font-size:3rem;"></i><p class="mt-3">ไม่พบข้อมูลในวันที่เลือก</p></div>';
        return;
    }

    container.innerHTML = `<div class="table-responsive"><table class="table table-hover table-bordered align-middle">
        <thead class="table-dark"><tr><th>#</th><th>ชั่วโมง</th><th>เครื่องจักร</th><th>สินค้า</th><th>พนักงานคุมเครื่อง</th><th>น้ำหนัก</th><th>พิกัด (ต่ำ-สูง)</th><th>สถานะ</th><th>QC ผู้ตรวจ</th><th>หมายเหตุ</th></tr></thead>
        <tbody>${filtered.map((r, i) => {
            const m = machines.find(x => x.id === r.machine_id);
            const o = operators.find(x => x.id === r.operator_id);
            const q = qcs.find(x => x.id === r.qc_id);
            const p = products.find(x => x.id === r.product_id);
            const statusBadge = r.status === 'ผ่าน' ? '<span class="badge bg-success">ผ่าน</span>' :
                r.status === 'ต่ำกว่าเกณฑ์' ? '<span class="badge bg-danger">ต่ำกว่าเกณฑ์</span>' :
                '<span class="badge bg-warning text-dark">เกินเกณฑ์</span>';
            return `<tr><td>${i + 1}</td><td><strong>${String(r.check_hour).padStart(2, '0')}:00</strong></td>
                <td>${m ? esc(m.machine_no) : '-'}</td><td>${p ? esc(p.name) : '-'}</td>
                <td>${o ? esc(o.name) : '-'}</td><td class="text-end fw-bold">${r.weight.toFixed(2)} ${p ? esc(p.unit) : ''}</td>
                <td class="text-center text-muted">${p ? p.min_weight + ' - ' + p.max_weight : '-'}</td>
                <td class="text-center">${statusBadge}</td><td>${q ? esc(q.name) : '-'}</td><td>${esc(r.note || '-')}</td></tr>`;
        }).join('')}</tbody></table></div>
    <div class="text-muted">แสดงข้อมูลทั้งหมด ${filtered.length} รายการ</div>`;
}

// ===== SUMMARY =====
function initSummaryDates() {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('summaryFrom').value = today;
    document.getElementById('summaryTo').value = today;
}

function loadSummary() {
    const from = document.getElementById('summaryFrom').value;
    const to = document.getElementById('summaryTo').value;
    const records = getData('records').filter(r => r.check_date >= from && r.check_date <= to);
    const machines = getData('machines');
    const operators = getData('operators');
    const qcs = getData('qc_inspectors');
    const products = getData('products');
    const totalMachines = machines.filter(m => m.is_active).length;

    const container = document.getElementById('summaryContainer');
    if (!records.length) {
        container.innerHTML = `
            <div class="card mb-4"><div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="bi bi-person-badge"></i> สรุปผลงานพนักงานคุมเครื่อง</h5></div>
            <div class="card-body"><div class="text-center py-4 text-muted"><i class="bi bi-inbox" style="font-size:2rem;"></i><p class="mt-2">ไม่พบข้อมูลในช่วงวันที่เลือก</p></div></div></div>
            <div class="card mb-4"><div class="card-header bg-info text-white"><h5 class="mb-0"><i class="bi bi-clipboard-check"></i> สรุปการตรวจของ QC</h5></div>
            <div class="card-body"><div class="text-center py-4 text-muted"><i class="bi bi-inbox" style="font-size:2rem;"></i><p class="mt-2">ไม่พบข้อมูลในช่วงวันที่เลือก</p></div></div></div>`;
        return;
    }

    // Operator totals
    const opMap = {};
    records.forEach(r => {
        const o = operators.find(x => x.id === r.operator_id);
        const key = o ? o.name : 'ไม่ทราบ';
        if (!opMap[key]) opMap[key] = { total: 0, pass: 0, fail: 0 };
        opMap[key].total++;
        if (r.status === 'ผ่าน') opMap[key].pass++; else opMap[key].fail++;
    });
    const opTotals = Object.entries(opMap).map(([name, d]) => ({
        name, ...d, rate: d.total ? (d.pass / d.total * 100).toFixed(1) : 0
    })).sort((a, b) => b.rate - a.rate);

    // Operator detail per hour
    const opDetailMap = {};
    records.forEach(r => {
        const o = operators.find(x => x.id === r.operator_id);
        const m = machines.find(x => x.id === r.machine_id);
        const p = products.find(x => x.id === r.product_id);
        const key = `${r.check_date}|${r.check_hour}|${o ? o.name : '?'}|${m ? m.machine_no : '?'}|${p ? p.name : '?'}`;
        if (!opDetailMap[key]) opDetailMap[key] = { date: r.check_date, hour: r.check_hour, operator: o ? o.name : '?', machine: m ? m.machine_no : '?', product: p ? p.name : '?', total: 0, pass: 0, under: 0, over: 0 };
        opDetailMap[key].total++;
        if (r.status === 'ผ่าน') opDetailMap[key].pass++;
        else if (r.status === 'ต่ำกว่าเกณฑ์') opDetailMap[key].under++;
        else opDetailMap[key].over++;
    });
    const opDetails = Object.values(opDetailMap).sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour || a.operator.localeCompare(b.operator));

    // QC summary per date
    const qcMap = {};
    records.forEach(r => {
        const q = qcs.find(x => x.id === r.qc_id);
        const key = `${q ? q.name : '?'}|${r.check_date}`;
        if (!qcMap[key]) qcMap[key] = { name: q ? q.name : '?', date: r.check_date, machines: new Set(), total: 0, hours: new Set() };
        qcMap[key].machines.add(r.machine_id);
        qcMap[key].hours.add(r.check_hour);
        qcMap[key].total++;
    });
    const qcSummary = Object.values(qcMap).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));

    // QC coverage per hour
    const qcCovMap = {};
    records.forEach(r => {
        const q = qcs.find(x => x.id === r.qc_id);
        const key = `${q ? q.name : '?'}|${r.check_date}|${r.check_hour}`;
        if (!qcCovMap[key]) qcCovMap[key] = { name: q ? q.name : '?', date: r.check_date, hour: r.check_hour, machines: new Set() };
        qcCovMap[key].machines.add(r.machine_id);
    });
    const qcCoverage = Object.values(qcCovMap).sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

    container.innerHTML = `
    <div class="card mb-4">
        <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="bi bi-person-badge"></i> สรุปผลงานพนักงานคุมเครื่อง</h5></div>
        <div class="card-body">
            <div class="table-responsive mb-4"><table class="table table-hover table-bordered align-middle">
                <thead class="table-dark"><tr><th>พนักงาน</th><th class="text-center">ตรวจทั้งหมด</th><th class="text-center">ผ่าน</th><th class="text-center">ไม่ผ่าน</th><th class="text-center">อัตราผ่าน (%)</th><th class="text-center">ระดับ</th></tr></thead>
                <tbody>${opTotals.map(o => {
                    const barCls = o.rate >= 95 ? 'bg-success' : o.rate >= 80 ? 'bg-warning' : 'bg-danger';
                    const level = o.rate >= 95 ? '<span class="badge bg-success">ดีเยี่ยม</span>' : o.rate >= 80 ? '<span class="badge bg-warning text-dark">ปานกลาง</span>' : '<span class="badge bg-danger">ต้องปรับปรุง</span>';
                    return `<tr><td class="fw-bold">${esc(o.name)}</td><td class="text-center">${o.total}</td>
                        <td class="text-center text-success fw-bold">${o.pass}</td><td class="text-center text-danger fw-bold">${o.fail}</td>
                        <td class="text-center"><div class="progress" style="height:22px;"><div class="progress-bar ${barCls}" style="width:${o.rate}%">${o.rate}%</div></div></td>
                        <td class="text-center">${level}</td></tr>`;
                }).join('')}</tbody></table></div>
            <h6 class="fw-bold mt-4 mb-3"><i class="bi bi-list-check"></i> รายละเอียดแต่ละชั่วโมง</h6>
            <div class="table-responsive"><table class="table table-sm table-hover table-bordered align-middle">
                <thead class="table-secondary"><tr><th>วันที่</th><th>ชั่วโมง</th><th>พนักงาน</th><th>เครื่องจักร</th><th>สินค้า</th><th class="text-center">ตรวจ</th><th class="text-center">ผ่าน</th><th class="text-center">ต่ำกว่า</th><th class="text-center">เกิน</th></tr></thead>
                <tbody>${opDetails.map(s => `<tr class="${s.under > 0 || s.over > 0 ? 'table-danger' : ''}">
                    <td>${s.date}</td><td>${String(s.hour).padStart(2, '0')}:00</td><td>${esc(s.operator)}</td><td>${esc(s.machine)}</td><td>${esc(s.product)}</td>
                    <td class="text-center">${s.total}</td><td class="text-center text-success">${s.pass}</td>
                    <td class="text-center text-danger fw-bold">${s.under}</td><td class="text-center text-warning fw-bold">${s.over}</td></tr>`).join('')}</tbody></table></div>
        </div>
    </div>
    <div class="card mb-4">
        <div class="card-header bg-info text-white"><h5 class="mb-0"><i class="bi bi-clipboard-check"></i> สรุปการตรวจของ QC</h5></div>
        <div class="card-body">
            <div class="table-responsive mb-4"><table class="table table-hover table-bordered align-middle">
                <thead class="table-dark"><tr><th>QC</th><th>วันที่</th><th class="text-center">เครื่องที่ตรวจ</th><th class="text-center">เครื่องทั้งหมด</th><th class="text-center">จำนวนครั้ง</th><th class="text-center">ชั่วโมงที่ตรวจ</th><th class="text-center">ความครอบคลุม</th></tr></thead>
                <tbody>${qcSummary.map(q => {
                    const cov = totalMachines ? (q.machines.size / totalMachines * 100) : 0;
                    const covBadge = cov >= 100 ? '<span class="badge bg-success">ครบ 100%</span>' : cov >= 75 ? `<span class="badge bg-warning text-dark">${cov.toFixed(0)}%</span>` : `<span class="badge bg-danger">${cov.toFixed(0)}%</span>`;
                    return `<tr><td class="fw-bold">${esc(q.name)}</td><td>${q.date}</td><td class="text-center">${q.machines.size}</td><td class="text-center">${totalMachines}</td>
                        <td class="text-center">${q.total}</td><td class="text-center">${q.hours.size}</td><td class="text-center">${covBadge}</td></tr>`;
                }).join('')}</tbody></table></div>
            <h6 class="fw-bold mt-4 mb-3"><i class="bi bi-clock"></i> ความถี่การตรวจรายชั่วโมง</h6>
            <div class="table-responsive"><table class="table table-sm table-hover table-bordered align-middle">
                <thead class="table-secondary"><tr><th>QC</th><th>วันที่</th><th>ชั่วโมง</th><th class="text-center">เครื่องที่ตรวจ</th><th class="text-center">เครื่องทั้งหมด</th><th class="text-center">สถานะ</th></tr></thead>
                <tbody>${qcCoverage.map(c => {
                    const checked = c.machines.size;
                    const statusBadge = checked >= totalMachines ? '<span class="badge bg-success">ตรวจครบ</span>' : `<span class="badge bg-danger">ตรวจไม่ครบ (ขาด ${totalMachines - checked} เครื่อง)</span>`;
                    return `<tr class="${checked < totalMachines ? 'table-warning' : ''}">
                        <td>${esc(c.name)}</td><td>${c.date}</td><td>${String(c.hour).padStart(2, '0')}:00</td>
                        <td class="text-center">${checked}</td><td class="text-center">${totalMachines}</td><td class="text-center">${statusBadge}</td></tr>`;
                }).join('')}</tbody></table></div>
        </div>
    </div>`;
}

// ===== UTILS =====
function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
});
