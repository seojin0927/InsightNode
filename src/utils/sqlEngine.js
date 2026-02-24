// sql.js WASM Engine Utilities for Client-Side Data Processing

let SQL = null;

// Initialize SQL.js WASM engine
export async function initSqlEngine() {
    try {
        if (!SQL) {
            // Use the globally loaded sql.js from CDN
            if (typeof window.initSqlJs === 'undefined') {
                throw new Error('sql.js not loaded. Please check internet connection.');
            }
            SQL = await window.initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
        }
        return new SQL.Database();
    } catch (error) {
        console.error('Failed to initialize SQL engine:', error);
        throw error;
    }
}

// Run SQL query on the database
export function runQuery(db, query) {
    if (!db) return null;
    try {
        const results = db.exec(query);
        if (results.length > 0) {
            const { columns, values } = results[0];
            return {
                columns,
                data: values.map(row => {
                    const obj = {};
                    columns.forEach((col, i) => {
                        obj[col] = row[i];
                    });
                    return obj;
                })
            };
        }
        return { columns: [], data: [] };
    } catch (error) {
        console.error('SQL Query Error:', error);
        throw error;
    }
}

// Create table from data
export function createTableFromData(db, tableName, data) {
    if (!db || !data.length) return;
    
    const columns = Object.keys(data[0]);
    const columnDefs = columns.map(col => `"${col}" TEXT`).join(', ');
    
    db.run(`DROP TABLE IF EXISTS ${tableName}`);
    db.run(`CREATE TABLE ${tableName} (${columnDefs})`);
    
    // Insert data
    const placeholders = columns.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO ${tableName} VALUES (${placeholders})`);
    
    data.forEach(row => {
        stmt.run(columns.map(col => row[col]));
    });
    
    stmt.free();
}

// Update a cell value
export function updateCell(db, tableName, rowId, column, value) {
    if (!db) return;
    const safeVal = String(value).replace(/'/g, "''");
    db.run(`UPDATE ${tableName} SET "${column}" = '${safeVal}' WHERE rowid = ${rowId}`);
}

// Delete rows based on condition
export function deleteRows(db, tableName, condition) {
    if (!db) return;
    db.run(`DELETE FROM ${tableName} WHERE ${condition}`);
}

// Add new column
export function addColumn(db, tableName, columnName, defaultValue = null) {
    if (!db) return;
    try {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN "${columnName}" TEXT`);
    } catch (e) {
        // Column might already exist
        console.warn('Column might already exist:', e.message);
    }
}

// Get column statistics
export function getColumnStats(db, tableName, column) {
    if (!db) return null;
    
    try {
        const result = db.exec(`
            SELECT 
                MIN(CAST("${column}" AS REAL)) as min_val,
                MAX(CAST("${column}" AS REAL)) as max_val,
                AVG(CAST("${column}" AS REAL)) as avg_val,
                COUNT(*) as count
            FROM ${tableName} 
            WHERE "${column}" IS NOT NULL AND "${column}" != ''
        `);
        
        if (result.length > 0 && result[0].values.length > 0) {
            const [min_val, max_val, avg_val, count] = result[0].values[0];
            return { min: min_val, max: max_val, avg: avg_val, count };
        }
    } catch (e) {
        console.error('Stats error:', e);
    }
    
    return null;
}

// Detect column data types
export function detectColumnTypes(data) {
    if (!data.length) return {};
    
    const sample = data.slice(0, 50);
    const types = {};
    const columns = Object.keys(data[0]);
    
    columns.forEach(col => {
        let isNum = true;
        let isDate = true;
        
        for (let i = 0; i < sample.length; i++) {
            const v = String(sample[i][col] ?? '');
            if (v === '') continue;
            if (isNaN(Number(v))) isNum = false;
            if (isNaN(Date.parse(v)) || !v.match(/\d/)) isDate = false;
        }
        
        if (isNum) types[col] = 'number';
        else if (isDate) types[col] = 'date';
        else types[col] = 'text';
    });
    
    return types;
}

// Export database to CSV
export function exportToCSV(data, columns) {
    if (!data.length) return '';
    
    const header = columns.join(',');
    const rows = data.map(row => 
        columns.map(col => {
            const val = String(row[col] ?? '');
            return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
    );
    
    return [header, ...rows].join('\n');
}

// Export database to JSON
export function exportToJSON(data) {
    return JSON.stringify(data, null, 2);
}
