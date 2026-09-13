import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Boxes,
  Package,
  ShoppingCart,
  Receipt,
  DollarSign,
  Truck,
  ClipboardCheck,
} from 'lucide-react';
import { VerificationRunner, VerificationTestResult } from '../../services/verificationRunner';
import { Part02VerificationRunner, Part02TestResult } from '../../services/part02VerificationRunner';
import { Part03VerificationRunner, Part03TestResult } from '../../services/part03VerificationRunner';
import { Part04VerificationRunner, Part04TestResult } from '../../services/part04VerificationRunner';
import { Part05VerificationRunner, Part05TestResult } from '../../services/part05VerificationRunner';
import { Part06VerificationRunner, Part06TestResult } from '../../services/part06VerificationRunner';

export const VerificationAuditSuite: React.FC = () => {
  const [activeSuiteTab, setActiveSuiteTab] = useState<
    'ALL' | 'PART_06' | 'PART_05' | 'PART_04' | 'PART_03' | 'PART_02' | 'PART_01'
  >('ALL');

  const [foundationTests, setFoundationTests] = useState<VerificationTestResult[]>(() =>
    VerificationRunner.runAllTests()
  );
  const [part02Tests, setPart02Tests] = useState<Part02TestResult[]>(() =>
    Part02VerificationRunner.runAllTests()
  );
  const [part03Tests, setPart03Tests] = useState<Part03TestResult[]>(() =>
    Part03VerificationRunner.runAllTests()
  );
  const [part04Tests, setPart04Tests] = useState<Part04TestResult[]>(() =>
    Part04VerificationRunner.runAllTests()
  );
  const [part05Tests, setPart05Tests] = useState<Part05TestResult[]>(() =>
    Part05VerificationRunner.runAllTests()
  );
  const [part06Tests, setPart06Tests] = useState<Part06TestResult[]>(() =>
    Part06VerificationRunner.runAllTests()
  );

  const [isRunning, setIsRunning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Overall counts
  const foundationPassed = foundationTests.filter((t) => t.status === 'PASSED').length;
  const part02Passed = part02Tests.filter((t) => t.status === 'PASSED').length;
  const part03Passed = part03Tests.filter((t) => t.status === 'PASSED').length;
  const part04Passed = part04Tests.filter((t) => t.status === 'PASSED').length;
  const part05Passed = part05Tests.filter((t) => t.status === 'PASSED').length;
  const part06Passed = part06Tests.filter((t) => t.status === 'PASSED').length;

  const totalTestsCount =
    foundationTests.length +
    part02Tests.length +
    part03Tests.length +
    part04Tests.length +
    part05Tests.length +
    part06Tests.length;

  const totalPassedCount =
    foundationPassed +
    part02Passed +
    part03Passed +
    part04Passed +
    part05Passed +
    part06Passed;

  const totalFailedCount = totalTestsCount - totalPassedCount;

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setFoundationTests(VerificationRunner.runAllTests());
      setPart02Tests(Part02VerificationRunner.runAllTests());
      setPart03Tests(Part03VerificationRunner.runAllTests());
      setPart04Tests(Part04VerificationRunner.runAllTests());
      setPart05Tests(Part05VerificationRunner.runAllTests());
      setPart06Tests(Part06VerificationRunner.runAllTests());
      setIsRunning(false);
    }, 400);
  };

  return (
    <div id="verification-audit-suite" className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base tracking-tight">
              Kedai PAPA POS — Continuous Verification &amp; Audit Suite
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Parts 01.5 &ndash; 06
            </span>
          </div>
          <p className="text-xs text-stone-300 max-w-2xl">
            Controlled verification of data model integrity, inventory movements, atomic POS checkout, sales &amp; profit reporting, supplier purchasing workflows, physical stock counts, and store-wide inventory reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
              Readiness Status
            </div>
            <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 justify-end">
              <CheckCircle2 className="w-4 h-4" />
              <span>{totalPassedCount} / {totalTestsCount} PASSED</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRerun}
            disabled={isRunning}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Auditing...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Mini Scoreboard Strip */}
      <div className="p-3 bg-stone-50 border-b border-stone-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
          <span className="text-emerald-700 block mb-0.5 font-medium">Part 06 Inventory</span>
          <span className="text-lg font-bold font-mono text-emerald-700">
            {part06Passed} / {part06Tests.length} Passed
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-stone-200 shadow-2xs">
          <span className="text-stone-500 block mb-0.5 font-medium">Part 05 Purchasing</span>
          <span className="text-lg font-bold font-mono text-stone-900">
            {part05Passed} / {part05Tests.length} Passed
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-stone-200 shadow-2xs">
          <span className="text-stone-500 block mb-0.5 font-medium">Part 04 Reports</span>
          <span className="text-lg font-bold font-mono text-stone-900">
            {part04Passed} / {part04Tests.length} Passed
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-stone-200 shadow-2xs">
          <span className="text-stone-500 block mb-0.5">Part 03 POS</span>
          <span className="text-lg font-bold font-mono text-stone-900">
            {part03Passed} / {part03Tests.length} Passed
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-stone-200 shadow-2xs">
          <span className="text-stone-500 block mb-0.5">Part 02 Stock</span>
          <span className="text-lg font-bold font-mono text-stone-900">
            {part02Passed} / {part02Tests.length} Passed
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-stone-200 shadow-2xs">
          <span className="text-stone-500 block mb-0.5">Part 01.5 Arch</span>
          <span className="text-lg font-bold font-mono text-stone-900">
            {foundationPassed} / {foundationTests.length} Passed
          </span>
        </div>
      </div>

      {/* Suite Selector Tabs */}
      <div className="p-3 border-b border-stone-200 flex flex-wrap gap-1.5 bg-stone-100/60">
        <button
          type="button"
          onClick={() => setActiveSuiteTab('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeSuiteTab === 'ALL'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          All Test Suites ({totalTestsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveSuiteTab('PART_06')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSuiteTab === 'PART_06'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Part 06: Advanced Inventory ({part06Passed}/{part06Tests.length} Tests 6.1&ndash;6.38)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSuiteTab('PART_05')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSuiteTab === 'PART_05'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Part 05: Purchasing &amp; Suppliers ({part05Passed}/{part05Tests.length} Tests A&ndash;AL)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSuiteTab('PART_04')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSuiteTab === 'PART_04'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>Part 04: Sales &amp; Profit Reports ({part04Passed}/{part04Tests.length} Tests A&ndash;I)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSuiteTab('PART_03')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSuiteTab === 'PART_03'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 text-stone-500" />
          <span>Part 03: POS Checkout ({part03Passed}/{part03Tests.length} Tests A&ndash;AJ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSuiteTab('PART_02')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSuiteTab === 'PART_02'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-stone-500" />
          <span>Part 02: Product &amp; Stock ({part02Passed}/{part02Tests.length} Tests A&ndash;U)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSuiteTab('PART_01')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSuiteTab === 'PART_01'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-stone-500" />
          <span>Part 01.5: Foundation ({foundationPassed}/{foundationTests.length} Tests 01&ndash;21)</span>
        </button>
      </div>

      {/* Test List Container */}
      <div className="divide-y divide-stone-200">
        {/* PART 06 TESTS */}
        {(activeSuiteTab === 'ALL' || activeSuiteTab === 'PART_06') && (
          <div>
            <div className="bg-stone-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Part 06: Advanced Inventory &amp; Reporting (TEST 6.1 &ndash; TEST 6.38)</span>
              </span>
              <span className="text-emerald-700 font-mono font-semibold">
                {part06Passed} / {part06Tests.length} Passed
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {part06Tests.map((t) => {
                const isExpanded = expandedId === `p6-${t.code}`;
                return (
                  <div key={t.code} className="p-3.5 hover:bg-stone-50/70 transition">
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : `p6-${t.code}`)}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 mt-0.5">
                          {t.code}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <span>{t.title}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 text-stone-500">
                              {t.category}
                            </span>
                          </h4>
                          {t.formulaOrMath && (
                            <div className="mt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded inline-block border border-emerald-100">
                              {t.formulaOrMath}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.status}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5 pl-9">
                        <div>
                          <strong className="text-stone-700">Expected:</strong> {t.expected}
                        </div>
                        <div>
                          <strong className="text-stone-700">Actual:</strong>{' '}
                          <span className="font-mono text-emerald-700">{t.actual}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Verification Details:</strong> {t.details}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PART 05 TESTS */}
        {(activeSuiteTab === 'ALL' || activeSuiteTab === 'PART_05') && (
          <div>
            <div className="bg-stone-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Part 05: Purchasing &amp; Supplier Management (TEST A &ndash; TEST AL)</span>
              </span>
              <span className="text-emerald-700 font-mono font-semibold">
                {part05Passed} / {part05Tests.length} Passed
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {part05Tests.map((t) => {
                const isExpanded = expandedId === `p5-${t.code}`;
                return (
                  <div key={t.code} className="p-3.5 hover:bg-stone-50/70 transition">
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : `p5-${t.code}`)}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 mt-0.5">
                          TEST {t.code}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <span>{t.title}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 text-stone-500">
                              {t.category}
                            </span>
                          </h4>
                          {t.formulaOrMath && (
                            <div className="mt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded inline-block border border-emerald-100">
                              {t.formulaOrMath}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.status}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5 pl-9">
                        <div>
                          <strong className="text-stone-700">Expected:</strong> {t.expected}
                        </div>
                        <div>
                          <strong className="text-stone-700">Actual:</strong>{' '}
                          <span className="font-mono text-emerald-700">{t.actual}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Verification Details:</strong> {t.details}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PART 04 TESTS */}
        {(activeSuiteTab === 'ALL' || activeSuiteTab === 'PART_04') && (
          <div>
            <div className="bg-stone-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                <span>Part 04: Sales &amp; Profit Reporting (TEST A &ndash; TEST I)</span>
              </span>
              <span className="text-emerald-700 font-mono font-semibold">
                {part04Passed} / {part04Tests.length} Passed
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {part04Tests.map((t) => {
                const isExpanded = expandedId === `p4-${t.code}`;
                return (
                  <div key={t.code} className="p-3.5 hover:bg-stone-50/70 transition">
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : `p4-${t.code}`)}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 mt-0.5">
                          TEST {t.code}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <span>{t.title}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 text-stone-500">
                              {t.category}
                            </span>
                          </h4>
                          {t.formulaOrMath && (
                            <div className="mt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded inline-block border border-emerald-100">
                              {t.formulaOrMath}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.status}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5 pl-9">
                        <div>
                          <strong className="text-stone-700">Expected:</strong> {t.expected}
                        </div>
                        <div>
                          <strong className="text-stone-700">Actual:</strong>{' '}
                          <span className="font-mono text-emerald-700">{t.actual}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Verification Details:</strong> {t.details}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PART 03 TESTS */}
        {(activeSuiteTab === 'ALL' || activeSuiteTab === 'PART_03') && (
          <div>
            <div className="bg-stone-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
                <span>Part 03: POS Checkout &amp; Sales Transaction (TEST A &ndash; TEST AJ)</span>
              </span>
              <span className="text-emerald-700 font-mono font-semibold">
                {part03Passed} / {part03Tests.length} Passed
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {part03Tests.map((t) => {
                const isExpanded = expandedId === `p3-${t.code}`;
                return (
                  <div key={t.code} className="p-3.5 hover:bg-stone-50/70 transition">
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : `p3-${t.code}`)}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 mt-0.5">
                          TEST {t.code}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <span>{t.title}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 text-stone-500">
                              {t.category}
                            </span>
                          </h4>
                          {t.formulaOrMath && (
                            <div className="mt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded inline-block border border-emerald-100">
                              {t.formulaOrMath}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.status}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5 pl-9">
                        <div>
                          <strong className="text-stone-700">Expected:</strong> {t.expected}
                        </div>
                        <div>
                          <strong className="text-stone-700">Actual:</strong>{' '}
                          <span className="font-mono text-emerald-700">{t.actual}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Verification Details:</strong> {t.details}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PART 02 TESTS */}
        {(activeSuiteTab === 'ALL' || activeSuiteTab === 'PART_02') && (
          <div>
            <div className="bg-stone-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-stone-600" />
                <span>Part 02: Product &amp; Inventory Management Tests (TEST A &ndash; TEST U)</span>
              </span>
              <span className="text-emerald-700 font-mono font-semibold">
                {part02Passed} / {part02Tests.length} Passed
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {part02Tests.map((t) => {
                const isExpanded = expandedId === `p2-${t.code}`;
                return (
                  <div key={t.code} className="p-3.5 hover:bg-stone-50/70 transition">
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : `p2-${t.code}`)}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 mt-0.5">
                          TEST {t.code}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <span>{t.title}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 text-stone-500">
                              {t.category}
                            </span>
                          </h4>
                          {t.formulaOrMath && (
                            <div className="mt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded inline-block border border-emerald-100">
                              {t.formulaOrMath}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.status}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5 pl-9">
                        <div>
                          <strong className="text-stone-700">Expected:</strong> {t.expected}
                        </div>
                        <div>
                          <strong className="text-stone-700">Actual:</strong>{' '}
                          <span className="font-mono text-emerald-700">{t.actual}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Verification Details:</strong> {t.details}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PART 01.5 TESTS */}
        {(activeSuiteTab === 'ALL' || activeSuiteTab === 'PART_01') && (
          <div>
            <div className="bg-stone-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-stone-600" />
                <span>Part 01.5: Foundation &amp; Architecture Tests (TEST 01 &ndash; 21)</span>
              </span>
              <span className="text-emerald-700 font-mono font-semibold">
                {foundationPassed} / {foundationTests.length} Passed
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {foundationTests.map((t) => {
                const isExpanded = expandedId === `p1-${t.id}`;
                return (
                  <div key={t.id} className="p-3.5 hover:bg-stone-50/70 transition">
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : `p1-${t.id}`)}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 mt-0.5">
                          TEST {t.id}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <span>{t.name}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 text-stone-500">
                              {t.category}
                            </span>
                          </h4>
                          {t.formulaOrMath && (
                            <div className="mt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded inline-block border border-emerald-100">
                              {t.formulaOrMath}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.status}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1.5 pl-9">
                        <div>
                          <strong className="text-stone-700">Expected:</strong> {t.expected}
                        </div>
                        <div>
                          <strong className="text-stone-700">Actual:</strong>{' '}
                          <span className="font-mono text-emerald-700">{t.actual}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Verification Details:</strong> {t.details}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
