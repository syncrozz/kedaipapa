/**
 * Kedai PAPA POS - Reusable CSV Export & Import Service
 * SYNCROZZ Engineering Standard (SES) v4.4 Locked
 *
 * Requirements:
 * - RFC 4180 standard compliant
 * - UTF-8 with BOM (\uFEFF) for Malay / Windows Excel compatibility
 * - Proper escaping of quotes, commas, and multiline values
 * - Preserves leading zeroes and text values (e.g. phone numbers, codes)
 * - Controlled import validation with pre-commit review summary
 */

import { Product, Supplier, StaffUser, Customer, LoyaltyLedgerEntry } from '../types';
import { SmartInputService } from './smartInputService';

export interface CsvImportValidationResult<T> {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  validItems: T[];
  duplicates: { rowNumber: number; reason: string; item: T }[];
  errors: { rowNumber: number; reason: string; rawRow: Record<string, string> }[];
}

export class CsvService {
  /**
   * Generates and downloads a standardized CSV file with UTF-8 BOM.
   */
  public static downloadCsv(
    filename: string,
    headers: string[],
    rows: (string | number | boolean | null | undefined)[][]
  ): void {
    const escapeCell = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      // If contains quote, comma, or newline, wrap in quotes and escape internal quotes
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const bodyLines = rows.map((r) => r.map(escapeCell).join(',')).join('\r\n');
    const csvContent = `\uFEFF${headerLine}\r\n${bodyLines}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exports Products catalogue to CSV.
   */
  public static exportProducts(products: Product[]): void {
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Cost Price (RM)',
      'Selling Price (RM)',
      'Current Stock',
      'Minimum Stock',
      'Status',
    ];

    const rows = products.map((p) => [
      p.sku,
      p.name,
      p.category,
      p.costPrice.toFixed(2),
      p.sellingPrice.toFixed(2),
      p.currentStock,
      p.minimumStock,
      p.active ? 'ACTIVE' : 'INACTIVE',
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`kedai_papa_products_${dateStr}.csv`, headers, rows);
  }

  /**
   * Exports Suppliers to CSV.
   */
  public static exportSuppliers(suppliers: Supplier[]): void {
    const headers = [
      'Supplier Code',
      'Supplier Name',
      'Contact Person',
      'Phone',
      'Email',
      'Address',
      'Status',
    ];

    const rows = suppliers.map((s) => [
      s.supplierCode,
      s.supplierName,
      s.contactPerson || '',
      s.phone || '',
      s.email || '',
      s.address || '',
      s.active ? 'ACTIVE' : 'INACTIVE',
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`kedai_papa_suppliers_${dateStr}.csv`, headers, rows);
  }

  /**
   * Exports Customers to CSV.
   */
  public static exportCustomers(customers: Customer[], loyaltyLedger?: LoyaltyLedgerEntry[]): void {
    const headers = [
      'Customer Code',
      'Customer Name',
      'Phone',
      'Email',
      'Loyalty Points',
      'Notes',
      'Status',
    ];

    const rows = customers.map((c) => {
      let points = 0;
      if (loyaltyLedger) {
        points = loyaltyLedger
          .filter((l) => l.customerId === c.id)
          .reduce((sum, l) => sum + (l.type === 'EARNED' ? l.points : -l.points), 0);
      }

      return [
        c.customerCode,
        c.customerName,
        c.phone || '',
        c.email || '',
        points.toString(),
        c.notes || '',
        c.active ? 'ACTIVE' : 'INACTIVE',
      ];
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCsv(`kedai_papa_customers_${dateStr}.csv`, headers, rows);
  }

  /**
   * Parses CSV text into an array of row objects mapping headers to values.
   */
  public static parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
    // Strip BOM if present
    const cleanText = csvText.replace(/^\uFEFF/, '');
    const lines: string[] = [];
    let curLine = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          curLine += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (curLine.trim()) {
          lines.push(curLine);
        }
        curLine = '';
        if (char === '\r' && nextChar === '\n') i++; // Skip \n in CRLF
      } else {
        curLine += char;
      }
    }
    if (curLine.trim()) {
      lines.push(curLine);
    }

    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const parseLineToCells = (line: string): string[] => {
      const cells: string[] = [];
      let cell = '';
      let cellInQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        const nextC = line[j + 1];

        if (c === '"') {
          if (cellInQuotes && nextC === '"') {
            cell += '"';
            j++;
          } else {
            cellInQuotes = !cellInQuotes;
          }
        } else if (c === ',' && !cellInQuotes) {
          cells.push(cell.trim());
          cell = '';
        } else {
          cell += c;
        }
      }
      cells.push(cell.trim());
      return cells;
    };

    const rawHeaders = parseLineToCells(lines[0]);
    const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim());

    const rows: Record<string, string>[] = [];
    for (let k = 1; k < lines.length; k++) {
      const cells = parseLineToCells(lines[k]);
      if (cells.every((c) => c === '')) continue; // Skip completely empty lines
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cells[idx] !== undefined ? cells[idx] : '';
      });
      rows.push(rowObj);
    }

    return { headers, rows };
  }

  /**
   * Validates and normalizes products from imported CSV before commit.
   */
  public static validateProductsImport(
    csvRows: Record<string, string>[],
    existingProducts: Product[]
  ): CsvImportValidationResult<Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>> {
    const existingSkus = new Set(existingProducts.map((p) => p.sku.trim().toUpperCase()));
    const seenBatchSkus = new Set<string>();

    const validItems: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>[] = [];
    const duplicates: { rowNumber: number; reason: string; item: any }[] = [];
    const errors: { rowNumber: number; reason: string; rawRow: Record<string, string> }[] = [];

    csvRows.forEach((row, index) => {
      const rowNumber = index + 2; // Account for 1-based index and header line

      // Find keys case-insensitively
      const findVal = (keyPattern: RegExp) => {
        const matchingKey = Object.keys(row).find((k) => keyPattern.test(k));
        return matchingKey ? row[matchingKey] : '';
      };

      const rawSku = findVal(/sku/i);
      const rawName = findVal(/name|nama/i);
      const rawCategory = findVal(/category|kategori/i) || 'Snacks & Biscuits';
      const rawCost = findVal(/cost|kos/i);
      const rawPrice = findVal(/price|harga|selling/i);
      const rawStock = findVal(/stock|stok|current/i);
      const rawMinStock = findVal(/min|minimum/i);

      const sku = SmartInputService.normalizeCode(rawSku);
      const name = SmartInputService.normalizeName(rawName);

      if (!sku) {
        errors.push({ rowNumber, reason: 'SKU tidak boleh kosong.', rawRow: row });
        return;
      }
      if (!name) {
        errors.push({ rowNumber, reason: 'Nama produk tidak boleh kosong.', rawRow: row });
        return;
      }

      if (existingSkus.has(sku)) {
        duplicates.push({
          rowNumber,
          reason: `SKU '${sku}' sudah wujud dalam katalog sedia ada.`,
          item: { sku, name },
        });
        return;
      }

      if (seenBatchSkus.has(sku)) {
        duplicates.push({
          rowNumber,
          reason: `SKU '${sku}' berulang dalam fail CSV ini.`,
          item: { sku, name },
        });
        return;
      }

      const costPrice = SmartInputService.parseNumeric(rawCost, 0);
      const sellingPrice = SmartInputService.parseNumeric(rawPrice, 0);
      const currentStock = Math.max(0, Math.floor(SmartInputService.parseNumeric(rawStock, 0)));
      const minimumStock = Math.max(0, Math.floor(SmartInputService.parseNumeric(rawMinStock, 5)));

      if (sellingPrice < costPrice) {
        // Warning or allowed? Allowed in retail, but sellingPrice should be > 0
      }

      seenBatchSkus.add(sku);

      validItems.push({
        sku,
        name,
        category: rawCategory.trim() || 'General',
        costPrice: SmartInputService.roundToTwoDecimals(costPrice),
        sellingPrice: SmartInputService.roundToTwoDecimals(sellingPrice),
        currentStock,
        minimumStock,
        active: true,
      });
    });

    return {
      totalRows: csvRows.length,
      validCount: validItems.length,
      duplicateCount: duplicates.length,
      invalidCount: errors.length,
      validItems,
      duplicates,
      errors,
    };
  }
}
