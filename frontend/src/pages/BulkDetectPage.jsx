import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  UploadCloud,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { predictBatch, useApi, getEda } from '../api';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Badge from '../components/Badge';

// ── Sample CSV template ──────────────────────────────────────────────────────
const SAMPLE_CSV = [
  'review_id,review_text,rating,user_id,product_id,review_date,helpful_votes,total_reviews',
  'R001,"This product is absolutely amazing! Best purchase ever!!!",5,U001,P001,2024-01-15,12,45',
  'R002,"Decent quality but shipping was slow.",3,U002,P002,2024-01-16,3,8',
  'R003,"Do not buy this!!! Complete waste of money!!!",1,U003,P001,2024-01-17,0,2',
  'R004,"Great value for money. Would recommend to friends.",4,U004,P003,2024-01-18,7,21',
  'R005,"Product matches description. Fast delivery.",4,U005,P002,2024-01-19,5,15',
].join('\n');

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getRiskLevel(prob) {
  if (prob >= 0.75) return 'High';
  if (prob >= 0.45) return 'Medium';
  return 'Low';
}

function getRiskColor(level) {
  if (level === 'High') return 'text-tl-fake bg-tl-fake-bg';
  if (level === 'Medium') return 'text-tl-warning bg-tl-warning-bg';
  return 'text-tl-genuine bg-tl-genuine-bg';
}

function PredictionBadge({ label }) {
  const lower = (label || '').toLowerCase();
  if (lower === 'fake') return <Badge variant="fake">Fake</Badge>;
  if (lower === 'genuine') return <Badge variant="genuine">Genuine</Badge>;
  return <Badge variant="warning">Uncertain</Badge>;
}

const DONUT_COLORS = { fake: '#E05A5A', genuine: '#2FAE7A', uncertain: '#E8A838' };

const PAGE_SIZE = 10;

export default function BulkDetectPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const fileRef = useRef();

  // Parse CSV text into header + rows
  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };
    const hdrs = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      // Simple CSV parse that handles quoted fields
      const cols = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      cols.push(cur.trim());
      const row = {};
      hdrs.forEach((h, i) => { row[h] = cols[i] || ''; });
      return row;
    });
    return { headers: hdrs, rows };
  };

  const handleFile = (f) => {
    setError('');
    setResults(null);
    if (!f) return;
    if (!f.name.endsWith('.csv')) { setError('Only CSV files are supported.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers: hdrs, rows } = parseCSV(e.target.result);
      if (!hdrs.includes('review_text')) {
        setError('CSV must contain a "review_text" column.');
        setFile(null);
        return;
      }
      setHeaders(hdrs);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setResults(null);
    try {
      const data = await predictBatch(file);
      setResults(data);
      setPage(1);
      setFilter('all');
      setSearch('');
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setResults(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Derived results ──────────────────────────────────────────────────────────
  const reviews = results?.results || results?.reviews || [];
  const summary = useMemo(() => {
    const fake = reviews.filter((r) => (r.label || r.prediction || '').toLowerCase() === 'fake').length;
    const genuine = reviews.filter((r) => (r.label || r.prediction || '').toLowerCase() === 'genuine').length;
    const uncertain = reviews.length - fake - genuine;
    return { total: reviews.length, fake, genuine, uncertain };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const label = (r.label || r.prediction || '').toLowerCase();
      const matchFilter =
        filter === 'all' ||
        (filter === 'fake' && label === 'fake') ||
        (filter === 'genuine' && label === 'genuine') ||
        (filter === 'uncertain' && label !== 'fake' && label !== 'genuine');
      const text = (r.review_text || r.text || '').toLowerCase();
      const id = String(r.review_id || r.id || '').toLowerCase();
      const matchSearch = !search || text.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [reviews, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const paginated = filteredReviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const donutData = [
    { name: 'Fake', value: summary.fake, color: DONUT_COLORS.fake },
    { name: 'Genuine', value: summary.genuine, color: DONUT_COLORS.genuine },
    { name: 'Uncertain', value: summary.uncertain, color: DONUT_COLORS.uncertain },
  ].filter((d) => d.value > 0);

  const handleDownloadCSV = () => {
    if (!reviews.length) return;
    const hdrs = ['review_id', 'review_text', 'prediction', 'fake_probability', 'risk_level'];
    const rows = reviews.map((r) => {
      const prob = r.fake_probability ?? r.probability ?? 0;
      return [
        r.review_id || r.id || '',
        `"${(r.review_text || r.text || '').replace(/"/g, '""')}"`,
        r.label || r.prediction || '',
        (prob * 100).toFixed(1) + '%',
        getRiskLevel(prob),
      ].join(',');
    });
    downloadCSV([hdrs.join(','), ...rows].join('\n'), 'bulk_analysis_results.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Review Detection"
        subtitle="Upload a CSV file to analyze multiple reviews at once."
      />

      {/* Upload Zone */}
      {!results && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Drag and drop your CSV file or click to browse. Max 10 MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Drop Zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && fileRef.current?.click()}
              className={[
                'border-2 border-dashed rounded-card p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
                isDragging
                  ? 'border-tl-accent bg-tl-accent-bg'
                  : 'border-tl-border hover:border-tl-accent hover:bg-tl-fill',
              ].join(' ')}
            >
              <UploadCloud size={40} className={isDragging ? 'text-tl-accent' : 'text-tl-muted'} />
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-tl-text">{file.name}</p>
                  <p className="text-xs text-tl-muted">{(file.size / 1024).toFixed(1)} KB — {preview.length} preview rows loaded</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-tl-text">Drop your CSV here, or <span className="text-tl-accent font-semibold">browse</span></p>
                  <p className="text-xs text-tl-muted mt-1">Supported: .csv — Required column: review_text</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-tl-fake bg-tl-fake-bg px-4 py-2.5 rounded-[10px]">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => downloadCSV(SAMPLE_CSV, 'sample_reviews.csv')}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-tl-border text-sm text-tl-text hover:bg-tl-fill transition-all"
              >
                <Download size={15} /> Download Sample CSV
              </button>
              {file && (
                <>
                  <button
                    onClick={clearFile}
                    className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-tl-border text-sm text-tl-fake hover:bg-tl-fake-bg transition-all"
                  >
                    <Trash2 size={15} /> Clear File
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 rounded-[10px] text-sm font-semibold text-white bg-gradient-to-r from-[#3A78F2] to-[#74A6FF] shadow-btn hover:opacity-90 transition-all disabled:opacity-60"
                  >
                    {loading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {loading ? 'Analyzing…' : 'Analyze All Reviews'}
                  </button>
                </>
              )}
            </div>

            {/* Preview Table */}
            {preview.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-tl-muted uppercase tracking-wider mb-2">Preview (first {preview.length} rows)</p>
                <div className="overflow-x-auto rounded-card border border-tl-border">
                  <table className="w-full text-xs">
                    <thead className="bg-tl-fill">
                      <tr>
                        {headers.slice(0, 6).map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-tl-muted uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tl-border">
                      {preview.map((row, i) => (
                        <tr key={i} className="hover:bg-tl-fill transition-colors">
                          {headers.slice(0, 6).map((h) => (
                            <td key={h} className="px-3 py-2 text-tl-text max-w-[180px] truncate">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Analyzed', value: summary.total, color: 'text-tl-accent', bg: 'bg-tl-accent-bg', border: 'border-l-tl-accent' },
              { label: 'Fake Reviews', value: summary.fake, color: 'text-tl-fake', bg: 'bg-tl-fake-bg', border: 'border-l-tl-fake' },
              { label: 'Genuine Reviews', value: summary.genuine, color: 'text-tl-genuine', bg: 'bg-tl-genuine-bg', border: 'border-l-tl-genuine' },
              { label: 'Uncertain', value: summary.uncertain, color: 'text-tl-warning', bg: 'bg-tl-warning-bg', border: 'border-l-tl-warning' },
            ].map((s) => (
              <Card key={s.label} className={`p-4 border-l-4 ${s.border}`}>
                <p className="text-[11px] font-semibold text-tl-muted uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                {summary.total > 0 && (
                  <p className="text-[11px] text-tl-muted mt-0.5">{((s.value / summary.total) * 100).toFixed(1)}%</p>
                )}
              </Card>
            ))}
          </div>

          {/* Chart + Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Donut Chart */}
            <Card className="p-4">
              <CardTitle className="text-sm mb-3">Distribution</CardTitle>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius="58%" outerRadius="80%" paddingAngle={3}>
                      {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #E6ECF5', borderRadius: 10, fontSize: 12 }}
                      formatter={(v, n) => [v, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-1">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1 text-xs text-tl-text">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </Card>

            {/* Rate Stats */}
            <Card className="p-4 col-span-1 md:col-span-2 flex flex-col justify-center gap-4">
              {[
                { label: 'Fake Rate', value: summary.fake, color: '#E05A5A', bg: '#FEF2F2' },
                { label: 'Genuine Rate', value: summary.genuine, color: '#2FAE7A', bg: '#F0FBF6' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs font-medium text-tl-text mb-1">
                    <span>{s.label}</span>
                    <span>{summary.total > 0 ? ((s.value / summary.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-tl-fill overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: summary.total > 0 ? `${(s.value / summary.total) * 100}%` : '0%',
                        background: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { setResults(null); setFile(null); setPreview([]); setHeaders([]); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-tl-border text-sm text-tl-text hover:bg-tl-fill transition-all"
                >
                  <RefreshCw size={14} /> New Analysis
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold text-white bg-gradient-to-r from-[#3A78F2] to-[#74A6FF] shadow-btn hover:opacity-90 transition-all"
                >
                  <FileDown size={14} /> Download CSV
                </button>
              </div>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>{filteredReviews.length} reviews shown</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters + Search */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex rounded-[10px] border border-tl-border overflow-hidden text-xs font-medium">
                  {['all', 'fake', 'genuine', 'uncertain'].map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFilter(f); setPage(1); }}
                      className={`px-3 py-2 capitalize transition-colors ${filter === f ? 'bg-tl-accent text-white' : 'bg-tl-card text-tl-text hover:bg-tl-fill'}`}
                    >
                      {f === 'all' ? `All (${summary.total})` : f === 'fake' ? `Fake (${summary.fake})` : f === 'genuine' ? `Genuine (${summary.genuine})` : `Uncertain (${summary.uncertain})`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 border border-tl-border rounded-[10px] px-3 py-2 bg-tl-fill flex-1 min-w-[180px]">
                  <Search size={14} className="text-tl-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Search reviews…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="bg-transparent text-xs text-tl-text placeholder-tl-muted outline-none w-full"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-card border border-tl-border">
                <table className="w-full text-xs">
                  <thead className="bg-tl-fill">
                    <tr>
                      {['Review ID', 'Review Snippet', 'Prediction', 'Fake Prob.', 'Risk Level'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-tl-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tl-border">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-tl-muted">No results match your filter.</td>
                      </tr>
                    ) : (
                      paginated.map((r, i) => {
                        const prob = r.fake_probability ?? r.probability ?? 0;
                        const label = r.label || r.prediction || 'Uncertain';
                        const risk = getRiskLevel(prob);
                        return (
                          <tr key={i} className="hover:bg-tl-fill transition-colors">
                            <td className="px-4 py-3 font-mono text-tl-muted whitespace-nowrap">{r.review_id || r.id || `#${i + 1}`}</td>
                            <td className="px-4 py-3 text-tl-text max-w-[260px] truncate">{r.review_text || r.text || '—'}</td>
                            <td className="px-4 py-3"><PredictionBadge label={label} /></td>
                            <td className="px-4 py-3 font-mono font-semibold" style={{ color: prob >= 0.5 ? '#E05A5A' : '#2FAE7A' }}>
                              {(prob * 100).toFixed(1)}%
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getRiskColor(risk)}`}>{risk}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-tl-muted">Page {page} of {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-[8px] border border-tl-border hover:bg-tl-fill disabled:opacity-40 transition-all"
                    >
                      <ChevronLeft size={15} className="text-tl-text" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-[8px] border border-tl-border hover:bg-tl-fill disabled:opacity-40 transition-all"
                    >
                      <ChevronRight size={15} className="text-tl-text" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
