import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle, X, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { CsvService, CsvImportValidationResult } from '../../services/csvService';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  onCommitImport: (items: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  onCommitImport,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<CsvImportValidationResult<
    Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>
  > | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFileName(null);
    setValidationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      try {
        const { rows } = CsvService.parseCsvText(text);
        const result = CsvService.validateProductsImport(rows, existingProducts);
        setValidationResult(result);
      } catch (err) {
        console.error('Failed to parse CSV', err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCommit = () => {
    if (!validationResult || validationResult.validItems.length === 0) return;
    onCommitImport(validationResult.validItems);
    handleReset();
    onClose();
  };

  return (
    <div
      id="csv-import-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleReset();
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Import Katalog Produk (CSV)
              </h3>
              <p className="text-[11px] text-stone-500">
                SES 4.4 Locked: Pengesahan &amp; Semakan Sebelum Komit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!validationResult ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition bg-stone-50 hover:bg-emerald-50/20 group"
              >
                <UploadCloud className="w-10 h-10 text-stone-400 group-hover:text-emerald-600 mx-auto mb-2 transition" />
                <p className="text-sm font-semibold text-stone-800">
                  Klik untuk memilih fail CSV produk
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Format disokong: SKU, Name, Category, Cost Price, Selling Price, Current Stock, Minimum Stock
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {isProcessing && (
                <div className="text-center py-4 text-xs text-stone-500">
                  Memproses &amp; mengesahkan data CSV...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File details & Summary Pills */}
              <div className="p-3 bg-stone-100 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-600" />
                  <span className="font-semibold text-stone-800">{fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-stone-500 hover:text-stone-800 underline text-[11px]"
                >
                  Pilih fail lain
                </button>
              </div>

              {/* Exact Calculated Metrics (SES 4.4 standard) */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 text-center">
                  <div className="text-base font-bold text-stone-900">{validationResult.totalRows}</div>
                  <div className="text-[10px] text-stone-500 uppercase font-medium">Jumlah Baris</div>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-center">
                  <div className="text-base font-bold text-emerald-700">{validationResult.validCount}</div>
                  <div className="text-[10px] text-emerald-600 uppercase font-medium">Sah (Sedia)</div>
                </div>
                <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-center">
                  <div className="text-base font-bold text-amber-700">{validationResult.duplicateCount}</div>
                  <div className="text-[10px] text-amber-600 uppercase font-medium">Duplikasi SKU</div>
                </div>
                <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-center">
                  <div className="text-base font-bold text-rose-700">{validationResult.invalidCount}</div>
                  <div className="text-[10px] text-rose-600 uppercase font-medium">Tidak Sah</div>
                </div>
              </div>

              {/* Duplicate or Invalid warnings */}
              {validationResult.duplicates.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{validationResult.duplicates.length} rekod dikecualikan kerana konflik/duplikasi SKU:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] max-h-24 overflow-y-auto space-y-0.5">
                    {validationResult.duplicates.map((d, i) => (
                      <li key={i}>
                        Baris {d.rowNumber}: {d.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{validationResult.errors.length} baris tidak sah:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] max-h-24 overflow-y-auto space-y-0.5">
                    {validationResult.errors.map((e, i) => (
                      <li key={i}>
                        Baris {e.rowNumber}: {e.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview of Valid Items */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 mb-2">
                  Pratonton Item Sah ({validationResult.validItems.length} produk)
                </h4>
                {validationResult.validItems.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">
                    Tiada item sah untuk diimport. Sila semak fail CSV anda.
                  </p>
                ) : (
                  <div className="border border-stone-200 rounded-lg overflow-x-auto max-h-48 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-stone-50 border-b border-stone-200 text-[11px] text-stone-600 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">SKU</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2 text-right">Kos</th>
                          <th className="p-2 text-right">Jual</th>
                          <th className="p-2 text-right">Stok</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {validationResult.validItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-stone-50/50">
                            <td className="p-2 font-mono font-medium text-stone-800">{item.sku}</td>
                            <td className="p-2 font-medium text-stone-900">{item.name}</td>
                            <td className="p-2 text-stone-600">{item.category}</td>
                            <td className="p-2 text-right text-stone-600">RM {item.costPrice.toFixed(2)}</td>
                            <td className="p-2 text-right font-medium text-stone-900">RM {item.sellingPrice.toFixed(2)}</td>
                            <td className="p-2 text-right text-stone-700">{item.currentStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            Batal
          </button>
          {validationResult && validationResult.validItems.length > 0 && (
            <button
              type="button"
              id="commit-csv-import-btn"
              onClick={handleCommit}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Komit Import ({validationResult.validItems.length} Produk)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
