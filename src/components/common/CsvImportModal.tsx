import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  Product,
  CsvImportMode,
  CommitUpsertPayload,
  UpsertImportCommitResult,
} from '../../types';
import {
  CsvService,
  CsvProductsUpsertValidationResult,
  CsvRowAction,
} from '../../services/csvService';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  onCommit?: (items: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>[]) => void;
  onCommitImport?: (items: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>[]) => void;
  onCommitUpsertImport?: (payload: CommitUpsertPayload) => UpsertImportCommitResult;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  onCommit,
  onCommitImport,
  onCommitUpsertImport,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[] | null>(null);
  const [importMode, setImportMode] = useState<CsvImportMode>('SKIP_EXISTING');
  const [isUpdateConfirmed, setIsUpdateConfirmed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | CsvRowAction>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commitResult, setCommitResult] = useState<UpsertImportCommitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute validation dynamically whenever parsedRows, existingProducts, or importMode changes
  const validationResult: CsvProductsUpsertValidationResult | null = useMemo(() => {
    if (!parsedRows) return null;
    return CsvService.validateProductsUpsert(parsedRows, existingProducts, importMode);
  }, [parsedRows, existingProducts, importMode]);

  // Filtered rows for the preview table
  const filteredRows = useMemo(() => {
    if (!validationResult) return [];
    if (activeFilter === 'ALL') return validationResult.rows;
    return validationResult.rows.filter((r) => r.action === activeFilter);
  }, [validationResult, activeFilter]);

  const handleReset = () => {
    setFileName(null);
    setParsedRows(null);
    setImportMode('SKIP_EXISTING');
    setIsUpdateConfirmed(false);
    setActiveFilter('ALL');
    setCommitResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);
    setCommitResult(null);
    setIsUpdateConfirmed(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      try {
        const { rows } = CsvService.parseCsvText(text);
        if (rows.length === 0) {
          setErrorMessage('Fail CSV kosong atau tidak mempunyai data yang sah.');
          setParsedRows(null);
        } else {
          setParsedRows(rows);
        }
      } catch (err) {
        console.error('Failed to parse CSV', err);
        setErrorMessage('Gagal memproses fail CSV. Sila pastikan format teks CSV adalah sah.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCommit = () => {
    if (!validationResult) return;
    setErrorMessage(null);

    try {
      const payload: CommitUpsertPayload = {
        mode: importMode,
        newItems: validationResult.newItems,
        updateItems: validationResult.updateItems,
        skippedCount: validationResult.skipCount,
        invalidCount: validationResult.invalidCount,
      };

      if (onCommitUpsertImport) {
        const res = onCommitUpsertImport(payload);
        setCommitResult(res);
      } else if (onCommitImport) {
        // Fallback for legacy single-callback
        onCommitImport(validationResult.newItems);
        setCommitResult({
          newCount: validationResult.newItems.length,
          updatedCount: 0,
          skippedCount: validationResult.skipCount,
          invalidCount: validationResult.invalidCount,
        });
      } else if (onCommit) {
        onCommit(validationResult.newItems);
        setCommitResult({
          newCount: validationResult.newItems.length,
          updatedCount: 0,
          skippedCount: validationResult.skipCount,
          invalidCount: validationResult.invalidCount,
        });
      }
    } catch (err: any) {
      console.error('Import commit error:', err);
      setErrorMessage(err.message || 'Ralat berlaku semasa mengimport data.');
    }
  };

  // Primary commit button text calculation (SES Requirement 10)
  const getCommitButtonLabel = () => {
    if (!validationResult) return 'Komit Import';

    if (importMode === 'UPDATE_EXISTING') {
      const { newCount, updateCount } = validationResult;
      if (newCount > 0 && updateCount > 0) {
        return `Komit Import (${newCount} Baru + ${updateCount} Kemas Kini)`;
      }
      if (newCount > 0 && updateCount === 0) {
        return `Komit Import (${newCount} Produk)`;
      }
      if (newCount === 0 && updateCount > 0) {
        return `Komit Import (${updateCount} Kemas Kini)`;
      }
      return 'Tiada Item Untuk Dikomit';
    } else {
      // SKIP_EXISTING mode
      const { newCount } = validationResult;
      if (newCount > 0) {
        return `Komit Import (${newCount} Produk)`;
      }
      return 'Tiada Produk Baru (Semua Dilangkau)';
    }
  };

  const isCommitDisabled = () => {
    if (!validationResult) return true;
    if (importMode === 'UPDATE_EXISTING') {
      const totalActionable = validationResult.newCount + validationResult.updateCount;
      if (totalActionable === 0) return true;
      if (validationResult.updateCount > 0 && !isUpdateConfirmed) return true;
      return false;
    } else {
      return validationResult.newCount === 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="csv-import-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Import Katalog Produk (CSV)
              </h3>
              <p className="text-[11px] text-stone-500">
                Mod Selamat: Pengesahan &amp; Mod Upsert (Langkau / Kemas Kini Sedia Ada)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-md hover:bg-stone-200/60 transition cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ralat Import</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STATE 1: Commit Completed Screen (Requirement 15) */}
          {commitResult ? (
            <div className="py-6 px-4 text-center space-y-5 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900">Import Selesai (Import Completed)</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Transaksi katalog berjaya disempurnakan secara atomik tanpa sebarang ralat.
                </p>
              </div>

              {/* Exact Breakdown (Requirement 15) */}
              <div className="grid grid-cols-2 gap-2 text-left bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                  <span className="text-[11px] text-stone-500 block">Produk Baru Ditambah:</span>
                  <span className="text-base font-bold text-emerald-700">{commitResult.newCount}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                  <span className="text-[11px] text-stone-500 block">Produk Dikemas Kini:</span>
                  <span className="text-base font-bold text-indigo-700">{commitResult.updatedCount}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                  <span className="text-[11px] text-stone-500 block">Produk Dilangkau:</span>
                  <span className="text-base font-bold text-amber-700">{commitResult.skippedCount}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                  <span className="text-[11px] text-stone-500 block">Baris Tidak Sah:</span>
                  <span className="text-base font-bold text-rose-700">{commitResult.invalidCount}</span>
                </div>
              </div>

              {/* Integrity Protection Assurance */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-left flex items-start gap-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Perlindungan Integriti Diperakui</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    Stok inventori fizikal sedia ada dan integriti snapshot kos/harga jualan sejarah (SaleItem) kekal dilindungi 100%.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="close-import-success-btn"
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Tutup (Kembali ke Katalog)
              </button>
            </div>
          ) : !validationResult ? (
            /* STATE 2: File Upload Screen */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition bg-stone-50 hover:bg-emerald-50/20 group"
              >
                <UploadCloud className="w-10 h-10 text-stone-400 group-hover:text-emerald-600 mx-auto mb-2 transition" />
                <p className="text-sm font-semibold text-stone-800">
                  Klik atau seret fail CSV produk ke sini
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Format standard: SKU, Name, Category, Cost Price, Selling Price, Current Stock, Minimum Stock, Status
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-blue-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Sistem Perlindungan Duplikasi &amp; Upsert Selamat Kedai PAPA</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Importer ini membolehkan anda memilih sama ada untuk melangkau (SKIP) atau mengemas kini (UPDATE) produk yang sepadan dengan SKU sedia ada. Stok sedia ada dan rekod jualan lama tidak akan ditimpa atau terjejas.
                </p>
              </div>

              {isProcessing && (
                <div className="text-center py-4 text-xs text-stone-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Menganalisis fail CSV dan menyemak katalog...</span>
                </div>
              )}
            </div>
          ) : (
            /* STATE 3: CSV Import Preview & Mode Selection (Requirement 9 & 11) */
            <div className="space-y-4">
              {/* File Pill */}
              <div className="p-2.5 bg-stone-100 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-600" />
                  <span className="font-semibold text-stone-800">{fileName}</span>
                  <span className="text-[11px] text-stone-500">({validationResult.totalRows} baris dikesan)</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-stone-600 hover:text-stone-900 underline text-[11px] cursor-pointer"
                >
                  Pilih fail lain
                </button>
              </div>

              {/* 1. Summary Metrics Section (Requirement 9) */}
              <div>
                <div className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>CSV IMPORT PREVIEW</span>
                  <span className="text-[11px] font-normal text-stone-500 lowercase">
                    {validationResult.totalRows} total rows
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 text-center">
                    <div className="text-base font-bold text-stone-900">{validationResult.totalRows}</div>
                    <div className="text-[10px] text-stone-500 uppercase font-medium">Total Rows</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-center">
                    <div className="text-base font-bold text-emerald-700">{validationResult.newCount}</div>
                    <div className="text-[10px] text-emerald-600 uppercase font-medium">New</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50 text-center">
                    <div className="text-base font-bold text-indigo-700">{validationResult.existingCount}</div>
                    <div className="text-[10px] text-indigo-600 uppercase font-medium">Existing</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-center">
                    <div className="text-base font-bold text-rose-700">{validationResult.invalidCount}</div>
                    <div className="text-[10px] text-rose-600 uppercase font-medium">Invalid</div>
                  </div>
                </div>
              </div>

              {/* 2. Import Mode Selection (Requirement 1 & 9) */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Pilihan Mod Import Untuk SKU Sedia Ada (Import Mode):
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {validationResult.existingCount} produk sedia ada dikesan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Mode A: SKIP EXISTING (Default) */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition ${
                      importMode === 'SKIP_EXISTING'
                        ? 'bg-white border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs'
                        : 'bg-white/60 border-stone-200 hover:bg-white text-stone-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="SKIP_EXISTING"
                      checked={importMode === 'SKIP_EXISTING'}
                      onChange={() => {
                        setImportMode('SKIP_EXISTING');
                        setIsUpdateConfirmed(false);
                      }}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                        <span>A. Langkau Sedia Ada (Skip Existing)</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded-sm font-normal">
                          Lalai (Default)
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug">
                        Kekalkan katalog sedia ada. Produk dengan SKU sedia ada akan dilangkau sepenuhnya ({validationResult.existingCount} dilangkau).
                      </p>
                    </div>
                  </label>

                  {/* Mode B: UPDATE EXISTING */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition ${
                      importMode === 'UPDATE_EXISTING'
                        ? 'bg-white border-indigo-500 ring-1 ring-indigo-500/20 shadow-xs'
                        : 'bg-white/60 border-stone-200 hover:bg-white text-stone-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="UPDATE_EXISTING"
                      checked={importMode === 'UPDATE_EXISTING'}
                      onChange={() => {
                        setImportMode('UPDATE_EXISTING');
                        setIsUpdateConfirmed(false);
                      }}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                        <span>B. Kemas Kini Sedia Ada (Update Existing)</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-sm font-normal">
                          Kemas Kini Selamat
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug">
                        Kemas kini nama, kategori, harga kos &amp; harga jual. Stok &amp; rekod jualan lama kekal dilindungi.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Stock Safety Notice (Requirement 4 & 6) */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-amber-800">Perlindungan Stok Sedia Ada: </span>
                  Lajur stok diabaikan untuk produk sedia ada. Stok sedia ada tidak akan ditimpa atau ditambah melalui import ini bagi mengelakkan kerosakan sejarah audit inventori.
                </div>
              </div>

              {/* 4. Explicit Confirmation Box when UPDATE EXISTING is active (Requirement 11) */}
              {importMode === 'UPDATE_EXISTING' && validationResult.updateCount > 0 && (
                <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-indigo-950">
                        Pengesahan Diperlukan (Explicit Confirmation):
                      </p>
                      <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                        {validationResult.updateCount} produk sedia ada akan dikemas kini.
                        Harga/katalog semasa akan berubah, tetapi rekod jualan lama tidak akan berubah.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 p-2 bg-white/80 rounded-md border border-indigo-200 text-[11px] font-medium text-stone-800 cursor-pointer hover:bg-white">
                    <input
                      type="checkbox"
                      id="confirm-update-existing-checkbox"
                      checked={isUpdateConfirmed}
                      onChange={(e) => setIsUpdateConfirmed(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      Saya faham dan mengesahkan kemas kini katalog bagi {validationResult.updateCount} produk sedia ada ini.
                    </span>
                  </label>
                </div>
              )}

              {/* 5. Filter Chips & Preview Table (Requirement 2 & 9) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-stone-800">
                    Pratonton Baris &amp; Klasifikasi Tindakan ({validationResult.rows.length} Baris)
                  </h4>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('ALL')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        activeFilter === 'ALL'
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Semua ({validationResult.rows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('NEW')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        activeFilter === 'NEW'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Baru ({validationResult.newCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('UPDATE')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        activeFilter === 'UPDATE'
                          ? 'bg-indigo-700 text-white'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      Kemas Kini ({validationResult.updateCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('SKIP')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        activeFilter === 'SKIP'
                          ? 'bg-amber-700 text-white'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      Dilangkau ({validationResult.skipCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('INVALID')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                        activeFilter === 'INVALID'
                          ? 'bg-rose-700 text-white'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      Tidak Sah ({validationResult.invalidCount})
                    </button>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-x-auto max-h-56 text-xs shadow-inner">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 border-b border-stone-200 text-[11px] text-stone-600 font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="p-2 w-10 text-center">#</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Produk</th>
                        <th className="p-2 text-right">Kos / Jual</th>
                        <th className="p-2 text-center">Tindakan (Action)</th>
                        <th className="p-2">Sebab &amp; Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-xs text-stone-500 italic">
                            Tiada rekod untuk tapisan ini.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-stone-50/80 transition ${
                              row.action === 'NEW'
                                ? 'bg-emerald-50/20'
                                : row.action === 'UPDATE'
                                ? 'bg-indigo-50/20'
                                : row.action === 'SKIP'
                                ? 'bg-amber-50/10 opacity-80'
                                : 'bg-rose-50/20'
                            }`}
                          >
                            <td className="p-2 text-center text-stone-400 text-[11px]">
                              {row.rowNumber}
                            </td>
                            <td className="p-2 font-mono font-medium text-stone-900 whitespace-nowrap">
                              {row.sku}
                            </td>
                            <td className="p-2">
                              <div className="font-medium text-stone-900">{row.name}</div>
                              <div className="text-[10px] text-stone-500">{row.category}</div>
                            </td>
                            <td className="p-2 text-right whitespace-nowrap text-[11px]">
                              <span className="text-stone-500">RM {row.costPrice.toFixed(2)}</span>
                              <span className="mx-1 text-stone-300">/</span>
                              <span className="font-semibold text-stone-900">RM {row.sellingPrice.toFixed(2)}</span>
                            </td>
                            <td className="p-2 text-center whitespace-nowrap">
                              {row.action === 'NEW' && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  NEW
                                </span>
                              )}
                              {row.action === 'UPDATE' && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  UPDATE
                                </span>
                              )}
                              {row.action === 'SKIP' && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  SKIP
                                </span>
                              )}
                              {row.action === 'INVALID' && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  INVALID
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-[11px] max-w-xs">
                              <div className="text-stone-700">{row.reason}</div>
                              {row.stockNote && (
                                <div
                                  className={`text-[10px] mt-0.5 ${
                                    row.action === 'UPDATE' || row.action === 'SKIP'
                                      ? 'text-amber-700 italic font-medium'
                                      : 'text-stone-500'
                                  }`}
                                >
                                  {row.stockNote}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            {commitResult ? 'Selesai' : 'Batal'}
          </button>

          {!commitResult && validationResult && (
            <button
              type="button"
              id="commit-csv-import-btn"
              onClick={handleCommit}
              disabled={isCommitDisabled()}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isCommitDisabled()
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : importMode === 'UPDATE_EXISTING'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{getCommitButtonLabel()}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
