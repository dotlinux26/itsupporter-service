import * as XLSX from 'xlsx';
import { getDb } from '../config/database.js';

export interface ExportOptions {
  type: 'orders' | 'settlements' | 'financial';
  format: 'xlsx' | 'csv';
  from?: string;
  to?: string;
  technicianId?: number;
  status?: string;
}

export function generateExportData(options: ExportOptions): { buffer: Buffer; mimeType: string; filename: string } {
  const db = getDb();
  const dateStr = new Date().toISOString().slice(0, 10);
  let rows: Record<string, unknown>[] = [];
  let sheetName = 'Sheet1';
  let filePrefix = 'export';

  if (options.type === 'orders') {
    sheetName = 'Don_hang';
    filePrefix = `orders_${dateStr}`;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (options.status) {
      where += ' AND o.status = ?';
      params.push(options.status);
    }
    if (options.technicianId) {
      where += ' AND o.technician_id = ?';
      params.push(options.technicianId);
    }
    if (options.from) {
      where += ' AND o.scheduled_date >= ?';
      params.push(options.from);
    }
    if (options.to) {
      where += ' AND o.scheduled_date <= ?';
      params.push(options.to);
    }

    const query = `
      SELECT o.code AS 'Mã đơn',
             c.name AS 'Khách hàng',
             c.phone AS 'SĐT khách',
             c.email AS 'Email khách',
             t.name AS 'Kỹ thuật viên',
             p.name AS 'Gói dịch vụ',
             o.scheduled_date AS 'Ngày thực hiện',
             o.scheduled_start AS 'Giờ bắt đầu',
             o.location AS 'Địa chỉ',
             o.price AS 'Giá gốc (VNĐ)',
             o.discount AS 'Giảm giá (VNĐ)',
             o.penalty AS 'Phạt vi phạm (VNĐ)',
             o.penalty_percent AS '% Phạt',
             o.extend_fee AS 'Phụ phí thêm (VNĐ)',
             o.final_amount AS 'Tổng thanh toán (VNĐ)',
             o.status AS 'Trạng thái đơn',
             o.payment_status AS 'Thanh toán',
             o.created_at AS 'Thời gian tạo'
      FROM orders o
      JOIN users c ON c.id = o.customer_id
      LEFT JOIN users t ON t.id = o.technician_id
      JOIN service_packages p ON p.id = o.package_id
      ${where}
      ORDER BY o.scheduled_date DESC, o.scheduled_start DESC
    `;
    rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  } else if (options.type === 'settlements') {
    sheetName = 'Ket_toan';
    filePrefix = `settlements_${dateStr}`;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (options.technicianId) {
      where += ' AND s.technician_id = ?';
      params.push(options.technicianId);
    }
    if (options.from) {
      where += ' AND s.created_at >= ?';
      params.push(options.from);
    }
    if (options.to) {
      where += ' AND s.created_at <= ?';
      params.push(options.to);
    }

    const query = `
      SELECT s.settlement_code AS 'Mã kết toán',
             t.name AS 'Kỹ thuật viên',
             m.name AS 'Quản lý duyệt',
             s.amount AS 'Số tiền kết toán (VNĐ)',
             s.balance_before AS 'Số dư trước',
             s.balance_after AS 'Số dư sau',
             s.notes AS 'Ghi chú',
             s.created_at AS 'Thời gian kết toán'
      FROM settlements s
      JOIN users t ON t.id = s.technician_id
      JOIN users m ON m.id = s.manager_id
      ${where}
      ORDER BY s.created_at DESC
    `;
    rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  } else if (options.type === 'financial') {
    sheetName = 'So_cai_tai_chinh';
    filePrefix = `financial_ledger_${dateStr}`;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (options.technicianId) {
      where += ' AND ft.technician_id = ?';
      params.push(options.technicianId);
    }
    if (options.from) {
      where += ' AND ft.created_at >= ?';
      params.push(options.from);
    }
    if (options.to) {
      where += ' AND ft.created_at <= ?';
      params.push(options.to);
    }

    const query = `
      SELECT ft.transaction_code AS 'Mã giao dịch',
             COALESCE(t.name, 'ĐỘI IT SUPPORTER') AS 'Đối tượng',
             ft.type AS 'Loại giao dịch',
             ft.amount AS 'Số tiền (VNĐ)',
             ft.direction AS 'Dòng tiền (IN/OUT)',
             ft.reference_id AS 'Mã tham chiếu',
             ft.created_at AS 'Thời gian ghi sổ'
      FROM financial_transactions ft
      LEFT JOIN users t ON t.id = ft.technician_id
      ${where}
      ORDER BY ft.created_at DESC
    `;
  }

  function sanitizeCellForExport(val: unknown): unknown {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(trimmed[0])) {
        return `'${val}`;
      }
    }
    return val;
  }

  const sanitizedRows = rows.map((row) => {
    const cleanRow: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      cleanRow[key] = sanitizeCellForExport(val);
    }
    return cleanRow;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sanitizedRows.length > 0 ? sanitizedRows : [{ 'Thông báo': 'Không có dữ liệu trong khoảng thời gian này' }]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  if (options.format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    // Add UTF-8 BOM so Excel opens Vietnamese characters correctly
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const buffer = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);
    return {
      buffer,
      mimeType: 'text/csv; charset=utf-8',
      filename: `${filePrefix}.csv`,
    };
  }

  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return {
    buffer: Buffer.isBuffer(xlsxBuffer) ? xlsxBuffer : Buffer.from(xlsxBuffer),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `${filePrefix}.xlsx`,
  };
}
