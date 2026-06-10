import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Upload, 
  Trash2, 
  HelpCircle, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  BookMarked,
  Layers,
  FileCode2,
  Info
} from 'lucide-react';
import { DocumentFile } from '../types';

interface RAGSectionProps {
  onIncrementDocument: () => void;
}

export default function RAGSection({ onIncrementDocument }: RAGSectionProps) {
  // Upload States
  const [pasteName, setPasteName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // List of active files
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Query States
  const [question, setQuestion] = useState('');
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  
  // Results
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<{ name: string; snippet: string; matchScore: number }[]>([]);

  // Selected document filters (defaults to all)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Fetch active indexed files on mount
  const fetchFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await fetch('/api/rag/documents');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error loading library documents:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handlePasteUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteName.trim() || !pasteContent.trim()) return;

    setUploading(true);
    setUploadError(null);

    try {
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pasteName.trim(),
          content: pasteContent.trim()
        })
      });

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.error || 'Failed to index document.');
      }

      await fetchFiles();
      setPasteName('');
      setPasteContent('');
      onIncrementDocument();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Connecting to Vector Database failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      const dataUrl = readerEvent.target?.result as string;
      if (!dataUrl) return;

      const commaIndex = dataUrl.indexOf(',');
      const base64 = commaIndex > -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;

      setUploading(true);
      setUploadError(null);

      try {
        const response = await fetch('/api/rag/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            fileData: base64,
            mimeType: file.type || 'application/octet-stream'
          })
        });

        if (!response.ok) {
          const errDetails = await response.json();
          throw new Error(errDetails.error || 'Gagal mengindeks file.');
        }

        await fetchFiles();
        onIncrementDocument();
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || 'Gagal mengunggah file.');
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      const response = await fetch(`/api/rag/documents/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
        setSelectedDocIds(prev => prev.filter(item => item !== id));
        // Clear matching answer if active
        setAnswer(null);
        setSources([]);
      }
    } catch (err) {
      console.error("Deleting document failed:", err);
    }
  };

  const handleQueryRAG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || files.length === 0) return;

    setQuerying(true);
    setQueryError(null);
    setAnswer(null);
    setSources([]);

    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          activeDocIds: selectedDocIds
        })
      });

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.error || 'Retrieval query execution failed.');
      }

      const data = await response.json();
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error(err);
      setQueryError(err.message || 'Failed to query Grounded Database.');
    } finally {
      setQuerying(false);
    }
  };

  const toggleDocFilter = (id: string) => {
    setSelectedDocIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Helper function to turn **bold** text to HTML formatted bold
  const parseBoldText = (text: string): string => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-950">$1</strong>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-indigo-700">$1</code>');
    return formatted;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Upload and Index Drawer */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Course Library Feed */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide font-display flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-slate-600" />
              Indexed Course Database
            </h3>
            <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 py-0.5 px-2 rounded-full font-bold">
              {files.length} Document{files.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loadingFiles ? (
            <div className="flex items-center gap-2 py-8 justify-center text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading vector documents...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-semibold">No materials matched in Vault.</p>
              <p className="text-slate-300 text-[11px] mt-0.5">Paste or browse files below to compute vector indices.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {files.map((file) => {
                const isFiltered = selectedDocIds.includes(file.id);
                return (
                  <div 
                    key={file.id}
                    onClick={() => toggleDocFilter(file.id)}
                    className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                      selectedDocIds.length === 0 || isFiltered
                        ? 'border-indigo-150 bg-indigo-50/10 hover:border-indigo-300'
                        : 'border-slate-150 bg-slate-50/40 opacity-60 hover:opacity-100 hover:border-slate-250'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <FileText className="w-4.5 h-4.5 text-slate-600 mt-1 flex-shrink-0" />
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-bold text-xs text-slate-950 truncate">{file.name}</h4>
                        <div className="flex gap-2 text-[10px] text-slate-400">
                          <span>{formatBytes(file.sizeBytes)}</span>
                          <span>•</span>
                          <span>{file.chunksCount} dense vectors</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selectedDocIds.length > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          isFiltered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isFiltered ? 'Filtering' : 'Muted'}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(file.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100/50 rounded transition-colors"
                        title="Delete from RAG memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {files.length > 0 && (
            <p className="text-[10px] text-slate-400 leading-snug">
              💡 Click any document above to narrow down RAG answers to individual files. Defaults to searching all materials.
            </p>
          )}
        </div>

        {/* Index File Form block */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-1 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Upload className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide font-display">Feed Documents to Vault</h4>
              <p className="text-[10px] text-slate-400">Embed textbooks, study plans, or lecture slide text</p>
            </div>
          </div>

          {/* Quick file picker click */}
          <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/10 transition-colors rounded-2xl py-6 px-3 flex flex-col items-center justify-center cursor-pointer group text-center">
            <input 
              id="rag-file-picker"
              type="file" 
              accept=".txt,.md,.pdf,.docx,.pptx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={uploading}
            />
            <div className="p-3 bg-white border border-slate-200 rounded-2xl group-hover:scale-110 shadow-xs transition-all pointer-events-none">
              <Upload className="w-5 h-5 text-indigo-600 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-800 mt-2.5">Upload Catatan atau Slide Kuliah</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">Mendukung PDF, Word (docx), PPT (pptx), Gambar (Slide/Catatan), dan text (.txt, .md)</p>
            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 mt-2 rounded-full uppercase tracking-wider">Pemrosesan Cerdas Gemini</span>
          </div>

          <div className="relative flex items-center justify-center my-3 select-none">
            <div className="absolute inset-y-1/2 left-0 right-0 border-t border-slate-100" />
            <span className="relative text-[10px] bg-white px-3 font-bold uppercase tracking-wider text-slate-400 z-10">or paste text</span>
          </div>

          {/* Text Paste Upload Form */}
          <form onSubmit={handlePasteUpload} className="space-y-3.5">
            <input
              id="rag-paste-title"
              type="text"
              required
              value={pasteName}
              onChange={(e) => setPasteName(e.target.value)}
              placeholder="e.g. Chapter 4 Chemistry.txt"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none transition-all placeholder-slate-450 font-medium"
              disabled={uploading}
            />

            <textarea
              id="rag-paste-content"
              required
              rows={4}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste text notes, syllabus definitions, formula lists..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none transition-all placeholder-slate-450 font-normal resize-none"
              disabled={uploading}
            />

            <button
              id="paste-index-btn"
              type="submit"
              disabled={uploading || !pasteName.trim() || !pasteContent.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Computing dense vectors...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Index Document Into Memory
                </>
              )}
            </button>
          </form>

          {uploadError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5 text-rose-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <p className="text-[11px] font-medium leading-relaxed">{uploadError}</p>
            </div>
          )}
        </div>

      </div>

      {/* RAG grounded Search Console Area */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Question console */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display">Grounded RAG Search Console</h3>
              <p className="text-xs text-slate-450 font-medium">Ask questions sourced entirely from your custom database files</p>
            </div>
          </div>

          <form onSubmit={handleQueryRAG} className="flex gap-2">
            <input
              id="rag-question-field"
              type="text"
              required
              disabled={querying || files.length === 0}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                files.length === 0 
                  ? "Please load or paste textbook notes first..." 
                  : "Enter a question regarding your library vault files..."
              }
              className="flex-1 px-4.5 py-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl outline-none transition-all placeholder-slate-400 text-sm font-medium text-slate-800 disabled:opacity-75"
            />
            <button
              id="rag-submit-btn"
              type="submit"
              disabled={querying || !question.trim() || files.length === 0}
              className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-sm transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {querying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {queryError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 text-rose-800 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{queryError}</p>
            </div>
          )}

          {/* Grounded QA RAG Answer */}
          {answer && (
            <div className="space-y-5 border-t border-slate-100 pt-5 animate-fade-in text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 py-1 px-3 rounded-full w-fit">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Grounded Synthesis Answered
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono select-none">AI Response</span>
                  <div className="space-y-2.5 text-slate-700 text-sm leading-relaxed font-normal">
                    {answer.split('\n').map((line, lIdx) => {
                      if (line.startsWith('* ') || line.startsWith('- ')) {
                        return (
                          <div key={lIdx} className="flex gap-2 pl-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2" />
                            <span dangerouslySetInnerHTML={{ __html: parseBoldText(line.substring(2)) }} />
                          </div>
                        );
                      }
                      if (line.trim() === '') return <div key={lIdx} className="h-2" />;
                      return <p key={lIdx} dangerouslySetInnerHTML={{ __html: parseBoldText(line) }} />;
                    })}
                  </div>
                </div>
              </div>

              {/* Matched references inside the vector db (FAISS + TF similarity mimics) */}
              {sources && sources.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-display flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-400" />
                    Matched Vector Fragments (Retrieval Grounding)
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {sources.map((src, sIdx) => {
                      const scorePct = Math.round(src.matchScore * 100);
                      return (
                        <div key={sIdx} className="bg-white border border-slate-180 p-4 rounded-2xl hover:shadow h-fit space-y-1.5 transition-all">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-slate-900 truncate max-w-[120px] font-display">📁 {src.name}</span>
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono text-[9px]">
                              {scorePct}% match
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 italic">
                            "{src.snippet}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
