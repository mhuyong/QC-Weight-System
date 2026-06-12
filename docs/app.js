// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://ougrkzfkohgfpfrrcmyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9mtbReCHJZIygMqHD-19jw_r-q5YNi-';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
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
async function addMachine(e) {
    e.preventDefault();
    const no = document.getElementById('newMachineNo').value.trim();
    const name = document.getElementById('newMachineName').value.trim();
    const { error } = await supabase.from('machines').insert({ machine_no: no, machine_name: name });
    if (error) { showToast(error.message.includes('duplicate') ? 'หมายเลขเครื่องจักรนี้มีอยู่แล้ว' : error.message, 'danger'); return false; }
    document.getElementById('newMachineNo').value = '';
    document.getElementById('newMachineName').value = '';
    showToast('เพิ่มเครื่องจักรสำเร็จ', 'success');
    renderSettings();
    return false;
}

async function toggleMachine(id) {
    const { data } = await supabase.from('machines').select('is_active').eq('id', id).single();
    await supabase.from('machines').update({ is_active: !data.is_active }).eq('id', id);
    renderSettings();
}

async function openEditMachine(id) {
    const { data } = await supabase.from('machines').select('*').eq('id', id).single();
    document.getElementById('editMachineId').value = id;
    document.getElementById('editMachineNo').value = data.machine_no;
    document.getElementById('editMachineName').value = data.machine_name || '';
    new bootstrap.Modal(document.getElementById('editMachineModal')).show();
}

async function saveMachineEdit() {
    const id = parseInt(document.getElementById('editMachineId').value);
    const no = document.getElementById('editMachineNo').value.trim();
    const name = document.getElementById('editMachineName').value.trim();
    const { error } = await supabase.from('machines').update({ machine_no: no, machine_name: name }).eq('id', id);
    if (error) { showToast(error.message.includes('duplicate') ? 'หมายเลขเครื่องจักรนี้มีอยู่แล้ว' : error.message, 'danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('editMachineModal')).hide();
    showToast('แก้ไขเครื่องจักรสำเร็จ', 'success');
    renderSettings();
}

// ===== SETTINGS: PRODUCTS =====
async function addProduct(e) {
    e.preventDefault();
    const name = document.getElementById('newProductName').value.trim();
    const target = parseFloat(document.getElementById('newProductTarget').value);
    const min = parseFloat(document.getElementById('newProductMin').value);
    const max = parseFloat(document.getElementById('newProductMax').value);
    const unit = document.getElementById('newProductUnit').value.trim() || 'กรัม';
    const { error } = await supabase.from('products').insert({ name, target_weight: target, min_weight: min, max_weight: max, unit });
    if (error) { showToast(error.message.includes('duplicate') ? 'ชื่อสินค้านี้มีอยู่แล้ว' : error.message, 'danger'); return false; }
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductTarget').value = '';
    document.getElementById('newProductMin').value = '';
    document.getElementById('newProductMax').value = '';
    document.getElementById('newProductUnit').value = '';
    showToast('เพิ่มสินค้าสำเร็จ', 'success');
    renderSettings();
    return false;
}

async function openEditProduct(id) {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    document.getElementById('editProductId').value = id;
    document.getElementById('editProductName').value = data.name;
    document.getElementById('editProductTarget').value = data.target_weight;
    document.getElementById('editProductMin').value = data.min_weight;
    document.getElementById('editProductMax').value = data.max_weight;
    document.getElementById('editProductUnit').value = data.unit;
    new bootstrap.Modal(document.getElementById('editProductModal')).show();
}

async function saveProductEdit() {
    const id = parseInt(document.getElementById('editProductId').value);
    const name = document.getElementById('editProductName').value.trim();
    const target = parseFloat(document.getElementById('editProductTarget').value);
    const min = parseFloat(document.getElementById('editProductMin').value);
    const max = parseFloat(document.getElementById('editProductMax').value);
    const unit = document.getElementById('editProductUnit').value.trim() || 'กรัม';
    const { error } = await supabase.from('products').update({ name, target_weight: target, min_weight: min, max_weight: max, unit }).eq('id', id);
    if (error) { showToast(error.message.includes('duplicate') ? 'ชื่อสินค้านี้มีอยู่แล้ว' : error.message, 'danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
    showToast('แก้ไขสินค้าสำเร็จ', 'success');
    renderSettings();
}

// ===== SETTINGS: OPERATORS =====
async function addOperator(e) {
    e.preventDefault();
    const name = document.getElementById('newOperatorName').value.trim();
    const empId = document.getElementById('newOperatorEmpId').value.trim();
    const { error } = await supabase.from('operators').insert({ name, employee_id: empId });
    if (error) { showToast(error.message.includes('duplicate') ? 'ชื่อพนักงานนี้มีอยู่แล้ว' : error.message, 'danger'); return false; }
    document.getElementById('newOperatorName').value = '';
    document.getElementById('newOperatorEmpId').value = '';
    showToast('เพิ่มพนักงานคุมเครื่องสำเร็จ', 'success');
    renderSettings();
    return false;
}

async function toggleOperator(id) {
    const { data } = await supabase.from('operators').select('is_active').eq('id', id).single();
    await supabase.from('operators').update({ is_active: !data.is_active }).eq('id', id);
    renderSettings();
}

async function openEditOperator(id) {
    const { data } = await supabase.from('operators').select('*').eq('id', id).single();
    document.getElementById('editOperatorId').value = id;
    document.getElementById('editOperatorName').value = data.name;
    document.getElementById('editOperatorEmpId').value = data.employee_id || '';
    new bootstrap.Modal(document.getElementById('editOperatorModal')).show();
}

async function saveOperatorEdit() {
    const id = parseInt(document.getElementById('editOperatorId').value);
    const name = document.getElementById('editOperatorName').value.trim();
    const empId = document.getElementById('editOperatorEmpId').value.trim();
    const { error } = await supabase.from('operators').update({ name, employee_id: empId }).eq('id', id);
    if (error) { showToast(error.message.includes('duplicate') ? 'ชื่อพนักงานนี้มีอยู่แล้ว' : error.message, 'danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('editOperatorModal')).hide();
    showToast('แก้ไขพนักงานคุมเครื่องสำเร็จ', 'success');
    renderSettings();
}

// ===== SETTINGS: QC =====
async function addQC(e) {
    e.preventDefault();
    const name = document.getElementById('newQCName').value.trim();
    const empId = document.getElementById('newQCEmpId').value.trim();
    const { error } = await supabase.from('qc_inspectors').insert({ name, employee_id: empId });
    if (error) { showToast(error.message.includes('duplicate') ? 'ชื่อ QC นี้มีอยู่แล้ว' : error.message, 'danger'); return false; }
    document.getElementById('newQCName').value = '';
    document.getElementById('newQCEmpId').value = '';
    showToast('เพิ่ม QC สำเร็จ', 'success');
    renderSettings();
    return false;
}

async function toggleQC(id) {
    const { data } = await supabase.from('qc_inspectors').select('is_active').eq('id', id).single();
    await supabase.from('qc_inspectors').update({ is_active: !data.is_active }).eq('id', id);
    renderSettings();
}

async function openEditQC(id) {
    const { data } = await supabase.from('qc_inspectors').select('*').eq('id', id).single();
    document.getElementById('editQCId').value = id;
    document.getElementById('editQCNameField').value = data.name;
    document.getElementById('editQCEmpId').value = data.employee_id || '';
    new bootstrap.Modal(document.getElementById('editQCModal')).show();
}

async function saveQCEdit() {
    const id = parseInt(document.getElementById('editQCId').value);
    const name = document.getElementById('editQCNameField').value.trim();
    const empId = document.getElementById('editQCEmpId').value.trim();
    const { error } = await supabase.from('qc_inspectors').update({ name, employee_id: empId }).eq('id', id);
    if (error) { showToast(error.message.includes('duplicate') ? 'ชื่อ QC นี้มีอยู่แล้ว' : error.message, 'danger'); return; }
    bootstrap.Modal.getInstance(document.getElementById('editQCModal')).hide();
    showToast('แก้ไข QC สำเร็จ', 'success');
    renderSettings();
}

// ===== RENDER SETTINGS =====
async function renderSettings() {
    const { data: machines } = await supabase.from('machines').select('*').order('machine_no');
    const { data: products } = await supabase.from('products').select('*').order('name');
    const { data: operators } = await supabase.from('operators').select('*').order('name');
    const { data: qcs } = await supabase.from('qc_inspectors').select('*').order('name');

    document.getElementById('machinesTable').innerHTML = machines && machines.length ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0">
        <thead class="table-light"><tr><th>เลขเครื่อง</th><th>ชื่อ</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${machines.map(m => `<tr class="${m.is_active ? '' : 'text-muted'}">
            <td>${esc(m.machine_no)}</td><td>${esc(m.machine_name || '-')}</td>
            <td>${m.is_active ? '<span class="badge bg-success">ใช้งาน</span>' : '<span class="badge bg-secondary">ปิดใช้งาน</span>'}</td>
            <td class="text-nowrap"><button class="btn btn-sm btn-outline-warning" onclick="openEditMachine(${m.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleMachine(${m.id})"><i class="bi bi-toggle-${m.is_active ? 'on' : 'off'}"></i></button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="text-muted text-center py-2">ยังไม่มีข้อมูล</p>';

    document.getElementById('productsTable').innerHTML = products && products.length ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0">
        <thead class="table-light"><tr><th>สินค้า</th><th>เป้า</th><th>ต่ำสุด</th><th>สูงสุด</th><th>หน่วย</th><th></th></tr></thead>
        <tbody>${products.map(p => `<tr>
            <td>${esc(p.name)}</td><td>${p.target_weight}</td><td>${p.min_weight}</td><td>${p.max_weight}</td><td>${esc(p.unit)}</td>
            <td><button class="btn btn-sm btn-outline-warning" onclick="openEditProduct(${p.id})"><i class="bi bi-pencil"></i></button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="text-muted text-center py-2">ยังไม่มีข้อมูล</p>';

    document.getElementById('operatorsTable').innerHTML = operators && operators.length ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0">
        <thead class="table-light"><tr><th>ชื่อ</th><th>รหัส</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${operators.map(o => `<tr class="${o.is_active ? '' : 'text-muted'}">
            <td>${esc(o.name)}</td><td>${esc(o.employee_id || '-')}</td>
            <td>${o.is_active ? '<span class="badge bg-success">ใช้งาน</span>' : '<span class="badge bg-secondary">ปิดใช้งาน</span>'}</td>
            <td class="text-nowrap"><button class="btn btn-sm btn-outline-warning" onclick="openEditOperator(${o.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleOperator(${o.id})"><i class="bi bi-toggle-${o.is_active ? 'on' : 'off'}"></i></button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="text-muted text-center py-2">ยังไม่มีข้อมูล</p>';

    document.getElementById('qcTable').innerHTML = qcs && qcs.length ? `<div class="table-responsive"><table class="table table-sm table-hover mb-0">
        <thead class="table-light"><tr><th>ชื่อ</th><th>รหัส</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${qcs.map(q => `<tr class="${q.is_active ? '' : 'text-muted'}">
            <td>${esc(q.name)}</td><td>${esc(q.employee_id || '-')}</td>
            <td>${q.is_active ? '<span class="badge bg-success">ใช้งาน</span>' : '<span class="badge bg-secondary">ปิดใช้งาน</span>'}</td>
            <td class="text-nowrap"><button class="btn btn-sm btn-outline-warning" onclick="openEditQC(${q.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleQC(${q.id})"><i class="bi bi-toggle-${q.is_active ? 'on' : 'off'}"></i></button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="text-muted text-center py-2">ยังไม่มีข้อมูล</p>';
}

// ===== RECORD PAGE =====
async function initRecordPage() {
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
    await populateDropdowns();
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

async function populateDropdowns() {
    const { data: machines } = await supabase.from('machines').select('*').eq('is_active', true).order('machine_no');
    const { data: operators } = await supabase.from('operators').select('*').eq('is_active', true).order('name');
    const { data: qcs } = await supabase.from('qc_inspectors').select('*').eq('is_active', true).order('name');
    const { data: products } = await supabase.from('products').select('*').order('name');

    document.getElementById('machineId').innerHTML = '<option value="">-- เลือกเครื่องจักร --</option>' +
        (machines || []).map(m => `<option value="${m.id}">${esc(m.machine_no)}${m.machine_name ? ' - ' + esc(m.machine_name) : ''}</option>`).join('');

    document.getElementById('productId').innerHTML = '<option value="">-- เลือกสินค้า --</option>' +
        (products || []).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

    document.getElementById('operatorId').innerHTML = '<option value="">-- เลือกพนักงาน --</option>' +
        (operators || []).map(o => `<option value="${o.id}">${esc(o.name)}${o.employee_id ? ' (' + esc(o.employee_id) + ')' : ''}</option>`).join('');

    document.getElementById('qcId').innerHTML = '<option value="">-- เลือก QC --</option>' +
        (qcs || []).map(q => `<option value="${q.id}">${esc(q.name)}${q.employee_id ? ' (' + esc(q.employee_id) + ')' : ''}</option>`).join('');
}

async function loadPreviousRecord() {
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

    const { data: records } = await supabase.from('weight_records')
        .select('*, operators(name), qc_inspectors(name), products(name)')
        .eq('machine_id', machineId).eq('check_date', prevDate).eq('check_hour', prevHour)
        .order('created_at', { ascending: false }).limit(1);

    if (records && records.length) {
        const r = records[0];
        prevInfo.classList.remove('d-none');
        document.getElementById('prevOperator').textContent = r.operators?.name || '-';
        document.getElementById('prevQC').textContent = r.qc_inspectors?.name || '-';
        document.getElementById('prevWeight').textContent = r.weight;
        const statusEl = document.getElementById('prevStatus');
        statusEl.textContent = r.status;
        statusEl.className = 'badge ' + (r.status === 'ผ่าน' ? 'bg-success' : 'bg-danger');

        document.getElementById('operatorId').value = r.operator_id;
        document.getElementById('qcId').value = r.qc_id;
        document.getElementById('productId').value = r.product_id;
        loadProductSpec();
    } else {
        prevInfo.classList.add('d-none');
    }
}

let currentSpec = null;
async function loadProductSpec() {
    const productId = parseInt(document.getElementById('productId').value);
    const specInfo = document.getElementById('specInfo');
    if (!productId) { specInfo.style.display = 'none'; currentSpec = null; return; }

    const { data } = await supabase.from('products').select('*').eq('id', productId).single();
    if (data) {
        currentSpec = data;
        document.getElementById('specTarget').textContent = data.target_weight;
        document.getElementById('specMin').textContent = data.min_weight;
        document.getElementById('specMax').textContent = data.max_weight;
        document.getElementById('specUnit').textContent = data.unit;
        document.getElementById('weightUnit').textContent = data.unit;
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

async function saveRecord(e) {
    e.preventDefault();
    const machineId = parseInt(document.getElementById('machineId').value);
    const productId = parseInt(document.getElementById('productId').value);
    const operatorId = parseInt(document.getElementById('operatorId').value);
    const qcId = parseInt(document.getElementById('qcId').value);
    const weight = parseFloat(document.getElementById('weightInput').value);
    const checkDate = document.getElementById('checkDate').value;
    const checkHour = parseInt(document.getElementById('checkHour').value);
    const note = document.getElementById('noteInput').value.trim();

    const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
    const status = determineStatus(weight, product.min_weight, product.max_weight);

    const { error } = await supabase.from('weight_records').insert({
        machine_id: machineId, operator_id: operatorId, qc_id: qcId,
        product_id: productId, weight, status, check_date: checkDate, check_hour: checkHour, note
    });

    if (error) { showToast('เกิดข้อผิดพลาด: ' + error.message, 'danger'); return false; }

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

async function loadRecords() {
    const date = document.getElementById('filterDate').value;
    const hour = document.getElementById('filterHour').value;

    let query = supabase.from('weight_records')
        .select('*, machines(machine_no), operators(name), qc_inspectors(name), products(name, min_weight, max_weight, unit)')
        .eq('check_date', date);

    if (hour !== '') query = query.eq('check_hour', parseInt(hour));
    query = query.order('check_hour', { ascending: false }).order('machine_id');

    const { data: filtered } = await query;
    const container = document.getElementById('recordsTableContainer');

    if (!filtered || !filtered.length) {
        container.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-inbox" style="font-size:3rem;"></i><p class="mt-3">ไม่พบข้อมูลในวันที่เลือก</p></div>';
        return;
    }

    container.innerHTML = `<div class="table-responsive"><table class="table table-hover table-bordered align-middle">
        <thead class="table-dark"><tr><th>#</th><th>ชั่วโมง</th><th>เครื่องจักร</th><th>สินค้า</th><th>พนักงานคุมเครื่อง</th><th>น้ำหนัก</th><th>พิกัด (ต่ำ-สูง)</th><th>สถานะ</th><th>QC ผู้ตรวจ</th><th>หมายเหตุ</th></tr></thead>
        <tbody>${filtered.map((r, i) => {
            const statusBadge = r.status === 'ผ่าน' ? '<span class="badge bg-success">ผ่าน</span>' :
                r.status === 'ต่ำกว่าเกณฑ์' ? '<span class="badge bg-danger">ต่ำกว่าเกณฑ์</span>' :
                '<span class="badge bg-warning text-dark">เกินเกณฑ์</span>';
            return `<tr><td>${i + 1}</td><td><strong>${String(r.check_hour).padStart(2, '0')}:00</strong></td>
                <td>${esc(r.machines?.machine_no)}</td><td>${esc(r.products?.name)}</td>
                <td>${esc(r.operators?.name)}</td><td class="text-end fw-bold">${Number(r.weight).toFixed(2)} ${esc(r.products?.unit)}</td>
                <td class="text-center text-muted">${r.products?.min_weight} - ${r.products?.max_weight}</td>
                <td class="text-center">${statusBadge}</td><td>${esc(r.qc_inspectors?.name)}</td><td>${esc(r.note || '-')}</td></tr>`;
        }).join('')}</tbody></table></div>
    <div class="text-muted">แสดงข้อมูลทั้งหมด ${filtered.length} รายการ</div>`;
}

// ===== SUMMARY =====
function initSummaryDates() {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('summaryFrom').value = today;
    document.getElementById('summaryTo').value = today;
}

async function loadSummary() {
    const from = document.getElementById('summaryFrom').value;
    const to = document.getElementById('summaryTo').value;

    const { data: records } = await supabase.from('weight_records')
        .select('*, machines(machine_no), operators(name), qc_inspectors(name), products(name)')
        .gte('check_date', from).lte('check_date', to);

    const { data: activeMachines } = await supabase.from('machines').select('id').eq('is_active', true);
    const totalMachines = activeMachines ? activeMachines.length : 0;

    const container = document.getElementById('summaryContainer');
    if (!records || !records.length) {
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
        const key = r.operators?.name || 'ไม่ทราบ';
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
        const key = `${r.check_date}|${r.check_hour}|${r.operators?.name}|${r.machines?.machine_no}|${r.products?.name}`;
        if (!opDetailMap[key]) opDetailMap[key] = { date: r.check_date, hour: r.check_hour, operator: r.operators?.name || '?', machine: r.machines?.machine_no || '?', product: r.products?.name || '?', total: 0, pass: 0, under: 0, over: 0 };
        opDetailMap[key].total++;
        if (r.status === 'ผ่าน') opDetailMap[key].pass++;
        else if (r.status === 'ต่ำกว่าเกณฑ์') opDetailMap[key].under++;
        else opDetailMap[key].over++;
    });
    const opDetails = Object.values(opDetailMap).sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

    // QC summary per date
    const qcMap = {};
    records.forEach(r => {
        const key = `${r.qc_inspectors?.name}|${r.check_date}`;
        if (!qcMap[key]) qcMap[key] = { name: r.qc_inspectors?.name || '?', date: r.check_date, machines: new Set(), total: 0, hours: new Set() };
        qcMap[key].machines.add(r.machine_id);
        qcMap[key].hours.add(r.check_hour);
        qcMap[key].total++;
    });
    const qcSummary = Object.values(qcMap).sort((a, b) => a.date.localeCompare(b.date));

    // QC coverage per hour
    const qcCovMap = {};
    records.forEach(r => {
        const key = `${r.qc_inspectors?.name}|${r.check_date}|${r.check_hour}`;
        if (!qcCovMap[key]) qcCovMap[key] = { name: r.qc_inspectors?.name || '?', date: r.check_date, hour: r.check_hour, machines: new Set() };
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
});
