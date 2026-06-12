from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
import sqlite3
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.secret_key = 'weight-qc-system-2024'

DB_PATH = os.path.join(os.path.dirname(__file__), 'weight_qc.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            target_weight REAL NOT NULL,
            min_weight REAL NOT NULL,
            max_weight REAL NOT NULL,
            unit TEXT DEFAULT 'กรัม',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS machines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_no TEXT NOT NULL UNIQUE,
            machine_name TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS operators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            employee_id TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS qc_inspectors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            employee_id TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS weight_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id INTEGER NOT NULL,
            operator_id INTEGER NOT NULL,
            qc_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            weight REAL NOT NULL,
            status TEXT NOT NULL,
            check_date DATE NOT NULL,
            check_hour INTEGER NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (machine_id) REFERENCES machines(id),
            FOREIGN KEY (operator_id) REFERENCES operators(id),
            FOREIGN KEY (qc_id) REFERENCES qc_inspectors(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE INDEX IF NOT EXISTS idx_records_date_hour ON weight_records(check_date, check_hour);
        CREATE INDEX IF NOT EXISTS idx_records_machine ON weight_records(machine_id);
        CREATE INDEX IF NOT EXISTS idx_records_operator ON weight_records(operator_id);
    ''')
    conn.commit()
    conn.close()


def determine_status(weight, min_w, max_w):
    if weight < min_w:
        return 'ต่ำกว่าเกณฑ์'
    elif weight > max_w:
        return 'เกินเกณฑ์'
    return 'ผ่าน'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/record', methods=['GET', 'POST'])
def record():
    conn = get_db()

    if request.method == 'POST':
        machine_id = request.form['machine_id']
        operator_id = request.form['operator_id']
        qc_id = request.form['qc_id']
        product_id = request.form['product_id']
        weight = float(request.form['weight'])
        check_date = request.form['check_date']
        check_hour = int(request.form['check_hour'])
        note = request.form.get('note', '')

        product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
        status = determine_status(weight, product['min_weight'], product['max_weight'])

        conn.execute('''
            INSERT INTO weight_records (machine_id, operator_id, qc_id, product_id, weight, status, check_date, check_hour, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (machine_id, operator_id, qc_id, product_id, weight, status, check_date, check_hour, note))
        conn.commit()

        status_class = 'success' if status == 'ผ่าน' else 'danger'
        flash(f'บันทึกสำเร็จ - สถานะ: {status}', status_class)
        conn.close()
        return redirect(url_for('record'))

    machines = conn.execute('SELECT * FROM machines WHERE is_active = 1 ORDER BY machine_no').fetchall()
    operators = conn.execute('SELECT * FROM operators WHERE is_active = 1 ORDER BY name').fetchall()
    qc_inspectors = conn.execute('SELECT * FROM qc_inspectors WHERE is_active = 1 ORDER BY name').fetchall()
    products = conn.execute('SELECT * FROM products ORDER BY name').fetchall()

    today = datetime.now().strftime('%Y-%m-%d')
    current_hour = datetime.now().hour

    conn.close()
    return render_template('record.html',
                           machines=machines, operators=operators,
                           qc_inspectors=qc_inspectors, products=products,
                           today=today, current_hour=current_hour)


@app.route('/api/previous-record')
def get_previous_record():
    machine_id = request.args.get('machine_id')
    check_date = request.args.get('check_date')
    check_hour = int(request.args.get('check_hour', 0))

    conn = get_db()

    prev_hour = check_hour - 1
    prev_date = check_date

    if prev_hour < 0:
        prev_hour = 23
        prev_dt = datetime.strptime(check_date, '%Y-%m-%d') - timedelta(days=1)
        prev_date = prev_dt.strftime('%Y-%m-%d')

    record = conn.execute('''
        SELECT wr.*, o.name as operator_name, o.id as prev_operator_id,
               q.name as qc_name, q.id as prev_qc_id,
               p.id as prev_product_id, p.name as product_name
        FROM weight_records wr
        JOIN operators o ON wr.operator_id = o.id
        JOIN qc_inspectors q ON wr.qc_id = q.id
        JOIN products p ON wr.product_id = p.id
        WHERE wr.machine_id = ? AND wr.check_date = ? AND wr.check_hour = ?
        ORDER BY wr.created_at DESC LIMIT 1
    ''', (machine_id, prev_date, prev_hour)).fetchone()

    conn.close()

    if record:
        return jsonify({
            'found': True,
            'operator_id': record['prev_operator_id'],
            'operator_name': record['operator_name'],
            'qc_id': record['prev_qc_id'],
            'qc_name': record['qc_name'],
            'product_id': record['prev_product_id'],
            'product_name': record['product_name'],
            'weight': record['weight'],
            'status': record['status']
        })
    return jsonify({'found': False})


@app.route('/api/product-spec')
def get_product_spec():
    product_id = request.args.get('product_id')
    conn = get_db()
    product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    conn.close()
    if product:
        return jsonify({
            'target_weight': product['target_weight'],
            'min_weight': product['min_weight'],
            'max_weight': product['max_weight'],
            'unit': product['unit']
        })
    return jsonify({})


@app.route('/records')
def records_list():
    conn = get_db()
    date_filter = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    hour_filter = request.args.get('hour', '')

    query = '''
        SELECT wr.*, m.machine_no, o.name as operator_name,
               q.name as qc_name, p.name as product_name,
               p.min_weight, p.max_weight, p.target_weight, p.unit
        FROM weight_records wr
        JOIN machines m ON wr.machine_id = m.id
        JOIN operators o ON wr.operator_id = o.id
        JOIN qc_inspectors q ON wr.qc_id = q.id
        JOIN products p ON wr.product_id = p.id
        WHERE wr.check_date = ?
    '''
    params = [date_filter]

    if hour_filter != '':
        query += ' AND wr.check_hour = ?'
        params.append(int(hour_filter))

    query += ' ORDER BY wr.check_hour DESC, m.machine_no'
    records = conn.execute(query, params).fetchall()
    conn.close()

    return render_template('records.html', records=records,
                           date_filter=date_filter, hour_filter=hour_filter)


@app.route('/summary')
def summary():
    conn = get_db()
    date_from = request.args.get('date_from', datetime.now().strftime('%Y-%m-%d'))
    date_to = request.args.get('date_to', datetime.now().strftime('%Y-%m-%d'))

    operator_summary = conn.execute('''
        SELECT o.name as operator_name, m.machine_no,
               p.name as product_name,
               wr.check_date, wr.check_hour,
               COUNT(*) as total_checks,
               SUM(CASE WHEN wr.status = 'ผ่าน' THEN 1 ELSE 0 END) as pass_count,
               SUM(CASE WHEN wr.status = 'ต่ำกว่าเกณฑ์' THEN 1 ELSE 0 END) as under_count,
               SUM(CASE WHEN wr.status = 'เกินเกณฑ์' THEN 1 ELSE 0 END) as over_count
        FROM weight_records wr
        JOIN operators o ON wr.operator_id = o.id
        JOIN machines m ON wr.machine_id = m.id
        JOIN products p ON wr.product_id = p.id
        WHERE wr.check_date BETWEEN ? AND ?
        GROUP BY o.name, m.machine_no, p.name, wr.check_date, wr.check_hour
        ORDER BY wr.check_date, wr.check_hour, o.name
    ''', (date_from, date_to)).fetchall()

    operator_totals = conn.execute('''
        SELECT o.name as operator_name,
               COUNT(*) as total_checks,
               SUM(CASE WHEN wr.status = 'ผ่าน' THEN 1 ELSE 0 END) as pass_count,
               SUM(CASE WHEN wr.status != 'ผ่าน' THEN 1 ELSE 0 END) as fail_count,
               ROUND(SUM(CASE WHEN wr.status = 'ผ่าน' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as pass_rate
        FROM weight_records wr
        JOIN operators o ON wr.operator_id = o.id
        WHERE wr.check_date BETWEEN ? AND ?
        GROUP BY o.name
        ORDER BY pass_rate DESC
    ''', (date_from, date_to)).fetchall()

    qc_summary = conn.execute('''
        SELECT q.name as qc_name,
               COUNT(DISTINCT wr.machine_id) as machines_checked,
               COUNT(*) as total_checks,
               COUNT(DISTINCT wr.check_hour) as hours_checked,
               wr.check_date
        FROM weight_records wr
        JOIN qc_inspectors q ON wr.qc_id = q.id
        WHERE wr.check_date BETWEEN ? AND ?
        GROUP BY q.name, wr.check_date
        ORDER BY wr.check_date, q.name
    ''', (date_from, date_to)).fetchall()

    total_machines = conn.execute('SELECT COUNT(*) as cnt FROM machines WHERE is_active = 1').fetchone()['cnt']

    qc_coverage = conn.execute('''
        SELECT q.name as qc_name,
               wr.check_date,
               wr.check_hour,
               COUNT(DISTINCT wr.machine_id) as machines_checked
        FROM weight_records wr
        JOIN qc_inspectors q ON wr.qc_id = q.id
        WHERE wr.check_date BETWEEN ? AND ?
        GROUP BY q.name, wr.check_date, wr.check_hour
        ORDER BY wr.check_date, wr.check_hour
    ''', (date_from, date_to)).fetchall()

    conn.close()

    return render_template('summary.html',
                           operator_summary=operator_summary,
                           operator_totals=operator_totals,
                           qc_summary=qc_summary,
                           qc_coverage=qc_coverage,
                           total_machines=total_machines,
                           date_from=date_from, date_to=date_to)


# ===== Master Data Management =====

@app.route('/settings')
def settings():
    conn = get_db()
    machines = conn.execute('SELECT * FROM machines ORDER BY machine_no').fetchall()
    operators = conn.execute('SELECT * FROM operators ORDER BY name').fetchall()
    qc_inspectors = conn.execute('SELECT * FROM qc_inspectors ORDER BY name').fetchall()
    products = conn.execute('SELECT * FROM products ORDER BY name').fetchall()
    conn.close()
    return render_template('settings.html',
                           machines=machines, operators=operators,
                           qc_inspectors=qc_inspectors, products=products)


@app.route('/settings/machine', methods=['POST'])
def add_machine():
    conn = get_db()
    try:
        conn.execute('INSERT INTO machines (machine_no, machine_name) VALUES (?, ?)',
                     (request.form['machine_no'], request.form.get('machine_name', '')))
        conn.commit()
        flash('เพิ่มเครื่องจักรสำเร็จ', 'success')
    except sqlite3.IntegrityError:
        flash('หมายเลขเครื่องจักรนี้มีอยู่แล้ว', 'danger')
    conn.close()
    return redirect(url_for('settings'))


@app.route('/settings/operator', methods=['POST'])
def add_operator():
    conn = get_db()
    try:
        conn.execute('INSERT INTO operators (name, employee_id) VALUES (?, ?)',
                     (request.form['name'], request.form.get('employee_id', '')))
        conn.commit()
        flash('เพิ่มพนักงานคุมเครื่องสำเร็จ', 'success')
    except sqlite3.IntegrityError:
        flash('ชื่อพนักงานนี้มีอยู่แล้ว', 'danger')
    conn.close()
    return redirect(url_for('settings'))


@app.route('/settings/qc', methods=['POST'])
def add_qc():
    conn = get_db()
    try:
        conn.execute('INSERT INTO qc_inspectors (name, employee_id) VALUES (?, ?)',
                     (request.form['name'], request.form.get('employee_id', '')))
        conn.commit()
        flash('เพิ่ม QC สำเร็จ', 'success')
    except sqlite3.IntegrityError:
        flash('ชื่อ QC นี้มีอยู่แล้ว', 'danger')
    conn.close()
    return redirect(url_for('settings'))


@app.route('/settings/product', methods=['POST'])
def add_product():
    conn = get_db()
    try:
        conn.execute('''INSERT INTO products (name, target_weight, min_weight, max_weight, unit)
                        VALUES (?, ?, ?, ?, ?)''',
                     (request.form['name'],
                      float(request.form['target_weight']),
                      float(request.form['min_weight']),
                      float(request.form['max_weight']),
                      request.form.get('unit', 'กรัม')))
        conn.commit()
        flash('เพิ่มสินค้าสำเร็จ', 'success')
    except sqlite3.IntegrityError:
        flash('ชื่อสินค้านี้มีอยู่แล้ว', 'danger')
    conn.close()
    return redirect(url_for('settings'))


@app.route('/settings/toggle/<table>/<int:item_id>')
def toggle_active(table, item_id):
    allowed = {'machines': 'machines', 'operators': 'operators', 'qc_inspectors': 'qc_inspectors'}
    if table not in allowed:
        flash('ไม่สามารถดำเนินการได้', 'danger')
        return redirect(url_for('settings'))

    conn = get_db()
    conn.execute(f'UPDATE {allowed[table]} SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?',
                 (item_id,))
    conn.commit()
    conn.close()
    flash('อัปเดตสถานะสำเร็จ', 'success')
    return redirect(url_for('settings'))


# ===== Edit Master Data =====

@app.route('/api/machine/<int:item_id>')
def get_machine(item_id):
    conn = get_db()
    row = conn.execute('SELECT * FROM machines WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    if row:
        return jsonify({'id': row['id'], 'machine_no': row['machine_no'], 'machine_name': row['machine_name'] or ''})
    return jsonify({}), 404


@app.route('/settings/machine/<int:item_id>', methods=['POST'])
def edit_machine(item_id):
    conn = get_db()
    try:
        conn.execute('UPDATE machines SET machine_no = ?, machine_name = ? WHERE id = ?',
                     (request.form['machine_no'], request.form.get('machine_name', ''), item_id))
        conn.commit()
        flash('แก้ไขเครื่องจักรสำเร็จ', 'success')
    except sqlite3.IntegrityError:
        flash('หมายเลขเครื่องจักรนี้มีอยู่แล้ว', 'danger')
    conn.close()
    return redirect(url_for('settings'))


@app.route('/api/operator/<int:item_id>')
def get_operator(item_id):
    conn = get_db()
    row = conn.execute('SELECT * FROM operators WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    if row:
        return jsonify({'id': row['id'], 'name': row['name'], 'employee_id': row['employee_id'] or ''})
    return jsonify({}), 404


@app.route('/settings/operator/<int:item_id>', methods=['POST'])
def edit_operator(item_id):
    conn = get_db()
    try:
        conn.execute('UPDATE operators SET name = ?, employee_id = ? WHERE id = ?',
                     (request.form['name'], request.form.get('employee_id', ''), item_id))
        conn.commit()
        flash('แก้ไขพนักงานคุมเครื่องสำเร็จ', 'success')
    except sqlite3.IntegrityError:
        flash('ชื่อพนักงานนี้มีอยู่แล้ว', 'danger')
    conn.close()
    return redirect(url_for('settings'))


@app.route('/api/qc/<int:item_id>')
def get_qc(item_id):
    conn = get_db()
    row = conn.execute('SELECT * FROM qc_inspectors WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    if row:
        return jsonify({'id': row['id'], 'name': row['name'], 'employee_id': row['employee_id'] or ''})
    return jsonify({}), 404


@app.route('/settings/qc/<int:item_id>', methods=['POST'])
def edit_qc(item_id):
    conn = get_db()
    try:
        conn.execute('UPDATE qc_inspectors SET name = ?, employee_id = ? WHERE id = ?',
                     (request.form['name'], request.form.get('employee_id', ''), item_id))
        conn.commit()
        flash('แก้ไข QC สำเร็จ', 'success')
    except sqlite3.IntegrityError:
        flash('ชื่อ QC นี้มีอยู่แล้ว', 'danger')
    conn.close()
    return redirect(url_for('settings'))


@app.route('/api/product/<int:item_id>')
def get_product(item_id):
    conn = get_db()
    row = conn.execute('SELECT * FROM products WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    if row:
        return jsonify({'id': row['id'], 'name': row['name'], 'target_weight': row['target_weight'],
                        'min_weight': row['min_weight'], 'max_weight': row['max_weight'], 'unit': row['unit']})
    return jsonify({}), 404


@app.route('/settings/product/<int:item_id>', methods=['POST'])
def edit_product(item_id):
    conn = get_db()
    try:
        conn.execute('''UPDATE products SET name = ?, target_weight = ?, min_weight = ?, max_weight = ?, unit = ?
                        WHERE id = ?''',
                     (request.form['name'],
                      float(request.form['target_weight']),
                      float(request.form['min_weight']),
                      float(request.form['max_weight']),
                      request.form.get('unit', 'กรัม'),
                      item_id))
        conn.commit()
        flash('แก้ไขสินค้าสำเร็จ', 'success')
    except sqlite3.IntegrityError:
        flash('ชื่อสินค้านี้มีอยู่แล้ว', 'danger')
    conn.close()
    return redirect(url_for('settings'))


if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5050))
    app.run(debug=True, port=port)
