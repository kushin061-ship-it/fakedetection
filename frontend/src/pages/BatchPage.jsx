import React, { useState, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { predictBatch } from '../api';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

const COLOR_FAKE = '#f43f5e';     // Rose-500
const COLOR_GENUINE = '#10b981';  // Emerald-500
const COLOR_LOW_CONF = '#f59e0b'; // Amber-500

/**
 * Generates sample CSV template for download
 */
function downloadSampleCsv() {
  const headers = ['review_text', 'rating', 'reviewer_id', 'date'];
  const sampleRows = [
    [
      '"BEST HEADPHONES EVER!! 10/10 MUST BUY NOW!! Completely transformed my life!"',
      '5',
      'USR-PROMO-991',
      '2026-10-10',
    ],
    [
      '"Decent battery life lasting around 28 hours during daily subway commutes. Solid build."',
      '4',
      'USR-GEN-1044',
      '2026-10-09',
    ],
    [
      '"DO NOT BUY THIS TRASH! Stopped working after literally two days, total scam!!"',
      '1',
      'USR-SMEAR-014',
      '2026-10-08',
    ],
    [
      '"Package arrived on time, seems ok so far. Haven\'t fully tested all functions yet."',
      '3',
      'USR-EDGE-3012',
      '2026-10-08',
    ],
    [
      '"Works great. Exactly as described. Fast shipping."',
      '5',
      'USR-BOT-7712',
      '2026-10-07',
    ],
    [
      '"Color accuracy is great after calibration. Black levels look deep without noticeable blooming."',
      '5',
      'USR-GEN-2001',
      '2026-10-06',
    ],
  ];

  const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_reviews_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads analyzed batch results as CSV
 */
function exportResultsAsCsv(results = [], filename = 'batch_audit_results.csv') {
  if (!results || results.length === 0) return;

  const headers = ['id', 'review_text', 'rating', 'reviewer_id', 'date', 'fake_probability', 'label', 'low_confidence'];
  const rows = results.map((r) => {
    const cleanText = `"${(r.review_text || '').replace(/"/g, '""')}"`;
    return [
      r.id,
      cleanText,
      r.rating,
      r.reviewer_id || '',
      r.date || '',
      (r.fake_probability || 0).toFixed(3),
      r.label,
      r.low_confidence ? 'true' : 'false',
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.replace(/\.csv$/, '') + '_evaluated.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function BatchPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchResponse, setBatchResponse] = useState(null);

  // Table filtering and pagination state
  const [labelFilter, setLabelFilter] = useState('all'); // 'all' | 'fake' | 'genuine' | 'low_confidence'
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  const fileInputRef = useRef(null);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Validate and set file
  const handleFileSelect = (file) => {
    setUploadError(null);
    if (!file) return;

    // Check extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Invalid file type: Only .csv files are supported.');
      return;
    }

    // Check size limit: 10 MB
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(
        `File too large: Uploaded file is ${(file.size / (1024 * 1024)).toFixed(2)} MB, but the maximum permitted limit is 10 MB.`
      );
      return;
    }

    // Check empty file
    if (file.size === 0) {
      setUploadError('The uploaded file is empty. Please select a CSV file containing review records.');
      return;
    }

    setSelectedFile(file);
    setBatchResponse(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setBatchResponse(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute batch prediction
  const handleRunBatchInference = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadError(null);
    setProgress(15);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 15;
      });
    }, 120);

    try {
      const response = await predictBatch(selectedFile);
      clearInterval(progressInterval);
      setProgress(100);
      setBatchResponse(response);
      setCurrentPage(1);
    } catch (err) {
      clearInterval(progressInterval);
      setUploadError(err.message || 'Failed to process batch CSV file. Check file format and required headers.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered and sorted table data
  const filteredResults = useMemo(() => {
    if (!batchResponse?.results) return [];
    let list = batchResponse.results;

    // Filter by label
    if (labelFilter === 'fake') {
      list = list.filter((r) => r.label === 'fake');
    } else if (labelFilter === 'genuine') {
      list = list.filter((r) => r.label === 'genuine');
    } else if (labelFilter === 'low_confidence') {
      list = list.filter((r) => r.low_confidence);
    }

    // Filter by search
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.review_text.toLowerCase().includes(q) ||
          (r.reviewer_id && r.reviewer_id.toLowerCase().includes(q))
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [batchResponse, labelFilter, tableSearch, sortField, sortDirection]);

  // Pagination
  const pageSize = 10;
  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Donut chart data
  const donutData = useMemo(() => {
    if (!batchResponse) return [];
    const lowConfCount = batchResponse.low_confidence_count || 0;
    const fakeCount = batchResponse.fake_count || 0;
    const genuineCount = batchResponse.genuine_count || 0;

    return [
      { name: 'Fake Reviews', value: fakeCount, color: COLOR_FAKE },
      { name: 'Genuine Reviews', value: genuineCount, color: COLOR_GENUINE },
      { name: 'Low Confidence', value: lowConfCount, color: COLOR_LOW_CONF },
    ].filter((item) => item.value > 0);
  }, [batchResponse]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Batch File Upload & Audit"
        subtitle="Upload bulk CSV exports to run multi-record inference, audit cohort fake rates, and export structured evaluation results."
        badge={
          <Badge variant="primary" dot size="sm">
            CSV Engine &bull; Max 10 MB
          </Badge>
        }
        actions={
          <Button variant="secondary" icon={Download} onClick={downloadSampleCsv}>
            Download Sample CSV
          </Button>
        }
        breadcrumbs={
          <span>
            Dashboard <span className="mx-1 text-slate-400">/</span> Batch Upload
          </span>
        }
      />

      {/* 1. Drag & Drop File Zone */}
      <Card className="p-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-4 ring-indigo-500/20'
              : selectedFile
              ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-soft-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Drag and drop your review CSV file here
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  or <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">browse local files</span> from your computer.
                </p>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Supports <strong className="font-mono">.csv</strong> files up to 10 MB. Must include headers: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">review_text</code> and <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">rating</code>.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {formatFileSize(selectedFile.size)} &bull; Ready for inference
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  icon={ShieldCheck}
                  loading={isProcessing}
                  onClick={handleRunBatchInference}
                >
                  Analyze Batch File
                </Button>
                <Button
                  variant="ghost"
                  icon={Trash2}
                  disabled={isProcessing}
                  onClick={handleRemoveFile}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-6 space-y-2 max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Evaluating review records via ensemble classifier...</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification Alert */}
        {uploadError && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Batch Validation Error</p>
              <p className="mt-0.5">{uploadError}</p>
            </div>
          </div>
        )}
      </Card>

      {/* 2. Results Section (StatCards, Donut, DataTable) */}
      {batchResponse ? (
        <div className="space-y-8 animate-fade-in">
          {/* StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Total Records Analyzed"
              value={batchResponse.total_processed}
              icon={FileText}
              description="Evaluated against XGBoost ensemble model"
            />
            <StatCard
              label="Fake Reviews Flagged"
              value={batchResponse.fake_count}
              icon={ShieldAlert}
              trend={{
                value: `${batchResponse.flagged_rate}% fake share`,
                isPositive: false,
              }}
              description="Recommended for quarantine"
              className="border-l-4 border-l-rose-500"
            />
            <StatCard
              label="Genuine Approvals"
              value={batchResponse.genuine_count}
              icon={ShieldCheck}
              description="Passed all linguistic and behavioral checks"
              className="border-l-4 border-l-emerald-500"
            />
            <StatCard
              label="Low Confidence Cases"
              value={batchResponse.low_confidence_count}
              icon={AlertTriangle}
              description="Score 0.40–0.60: Manual auditor review"
              className="border-l-4 border-l-amber-500"
            />
          </div>

          {/* Donut Chart & Cohort Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 flex flex-col justify-between">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-base sm:text-lg">Cohort Class Distribution</CardTitle>
                <CardDescription className="text-xs">
                  Proportion of Fake vs. Genuine vs. Low Confidence in uploaded file
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0 flex flex-col items-center">
                <div className="h-60 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0];
                            return (
                              <div className="bg-white/95 dark:bg-slate-900/95 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-soft-sm">
                                <span className="font-bold">{item.name}:</span>{' '}
                                <span className="font-mono">{item.value} reviews</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`donut-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                      {batchResponse.flagged_rate}%
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Fake Rate
                    </span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-center gap-4 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Fake ({batchResponse.fake_count})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Genuine ({batchResponse.genuine_count})</span>
                  </div>
                  {batchResponse.low_confidence_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Borderline ({batchResponse.low_confidence_count})</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Audit Actions & Export Card */}
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <CardHeader className="px-0 pt-0 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Batch Audit Summary</CardTitle>
                    <CardDescription className="text-xs">
                      File: <strong className="text-slate-700 dark:text-slate-300 font-mono">{batchResponse.filename}</strong> &bull; Processed: {new Date(batchResponse.processed_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="primary"
                    icon={Download}
                    onClick={() => exportResultsAsCsv(batchResponse.results, batchResponse.filename)}
                  >
                    Download Results as CSV
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="px-0 pb-0 space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Audit Completion Status
                  </h4>
                  <p>
                    All {batchResponse.total_processed} review records in the dataset were parsed, validated, and processed through the multimodal fake review inference pipeline.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Flagged Quarantine</span>
                    <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      {batchResponse.fake_count} reviews
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Approved Genuine</span>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {batchResponse.genuine_count} reviews
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Manual Review Rate</span>
                    <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {((batchResponse.low_confidence_count / batchResponse.total_processed) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  Note: Client-side export packages include predicted labels, calculated fake probabilities, and low-confidence flags for integration into internal moderation workflows.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 3. Detailed Results DataTable */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <CardTitle className="text-base sm:text-lg">Detailed Review Predictions</CardTitle>
                <CardDescription className="text-xs">
                  Inspect inference predictions for each review record in this batch
                </CardDescription>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setLabelFilter('all');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      labelFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-soft-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All ({batchResponse.results?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLabelFilter('fake');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      labelFilter === 'fake'
                        ? 'bg-rose-500 text-white shadow-soft-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    Fake ({batchResponse.fake_count})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLabelFilter('genuine');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      labelFilter === 'genuine'
                        ? 'bg-emerald-500 text-white shadow-soft-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    Genuine ({batchResponse.genuine_count})
                  </button>
                  {batchResponse.low_confidence_count > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLabelFilter('low_confidence');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        labelFilter === 'low_confidence'
                          ? 'bg-amber-500 text-white shadow-soft-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                      }`}
                    >
                      Borderline ({batchResponse.low_confidence_count})
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search batch..."
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th
                      onClick={() => toggleSort('id')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      <div className="flex items-center gap-1">
                        <span>ID</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 min-w-[300px]">Review Text</th>
                    <th
                      onClick={() => toggleSort('rating')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      <div className="flex items-center gap-1">
                        <span>Rating</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Author ID</th>
                    <th
                      onClick={() => toggleSort('fake_probability')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 min-w-[140px]"
                    >
                      <div className="flex items-center gap-1">
                        <span>P(Fake)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Prediction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No reviews found matching the current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedResults.map((row) => {
                      const probPercent = Math.round(row.fake_probability * 100);

                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {row.id}
                          </td>
                          <td className="py-3 px-3 text-slate-800 dark:text-slate-200">
                            <p className="line-clamp-2">{row.review_text}</p>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <span>{row.rating}</span>
                              <Star className="w-3 h-3 fill-current" />
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                            {row.reviewer_id || 'ANON'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {probPercent}%
                                </span>
                                {row.low_confidence && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    Borderline
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    row.label === 'fake'
                                      ? 'bg-rose-500'
                                      : row.low_confidence
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${probPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                row.low_confidence
                                  ? 'warning'
                                  : row.label === 'fake'
                                  ? 'fake'
                                  : 'genuine'
                              }
                              size="sm"
                              dot
                            >
                              {row.low_confidence
                                ? 'Borderline'
                                : row.label === 'fake'
                                ? 'Fake'
                                : 'Genuine'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  Page <strong className="text-slate-800 dark:text-slate-200 font-mono">{currentPage}</strong> of{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalPages}</strong> (
                  {filteredResults.length} records)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState
          title="No Batch Results Loaded"
          description="Upload a CSV review export above to begin multi-record inference, audit batch fake rates, and generate exportable validation reports."
          actionText="Download Sample CSV"
          onAction={downloadSampleCsv}
        />
      )}
    </div>
  );
}

export default BatchPage;
