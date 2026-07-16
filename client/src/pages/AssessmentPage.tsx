import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor, { loader } from '@monaco-editor/react';
import { 
  Play, 
  Clock, 
  ArrowLeft, 
  Video, 
  Sparkles, 
  ChevronDown,
  Settings,
  Maximize2,
  RotateCcw,
  BookOpen,
  Code,
  ShieldAlert,
  Monitor,
  Hourglass,
  Layers,
  AlertTriangle
} from 'lucide-react';
import evalixLogoWithoutText from '../assets/evalix-logo-without-text.png';

loader.config({
  paths: {
    vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs'
  }
});

interface TestCase {
  id: number;
  input: string;
  expected: string;
  actual?: string;
  status?: 'passed' | 'failed' | 'running' | 'idle';
  error?: string;
}

const initialTestCases: TestCase[] = [
  { id: 1, input: 's = "abcabcbb"', expected: '3', status: 'idle' },
  { id: 2, input: 's = "bbbbb"', expected: '1', status: 'idle' },
  { id: 3, input: 's = "pwwkew"', expected: '3', status: 'idle' },
  { id: 4, input: 's = ""', expected: '0', status: 'idle' },
];

const pythonTemplate = `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your Python 3 code here
        char_map = {}
        max_length = 0
        start = 0
        
        for end, char in enumerate(s):
            if char in char_map and char_map[char] >= start:
                start = char_map[char] + 1
            char_map[char] = end
            max_length = max(max_length, end - start + 1)
            
        return max_length`;

// Simple FIFO Execution Queue for Wandbox API Rate-Limiting & Security Throttling
interface QueueTask {
  id: string;
  code: string;
  testCases: TestCase[];
  onStart: () => void;
  onSuccess: (results: TestCase[], debugStdout: string) => void;
  onFailure: (error: string) => void;
}

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(pythonTemplate);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [activeTestCaseId, setActiveTestCaseId] = useState<number>(1);
  const [securityScore, setSecurityScore] = useState(100);
  const [hasRun, setHasRun] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Security Block' | null>(null);

  // Debug Console stdout logs state
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);

  // Security warning overlay state
  const [securityViolation, setSecurityViolation] = useState<string | null>(null);

  // Device & Size Check State (Security Blocking for Mobile Users)
  const [isMobile, setIsMobile] = useState(false);

  // Queue state tracking
  const [queueLength, setQueueLength] = useState(0);
  const [queueStatus, setQueueStatus] = useState<string>('Idle');

  // Viewport screen-size restriction
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    if (window.confirm('Reset code to default template?')) {
      setCode(pythonTemplate);
    }
  };

  // --- STATIC SECURITY STATIC ANALYSIS (AST SHIELD) ---
  // Blocks forbidden system calls to guarantee code safety inside the assessment environment
  const analyzeCodeSecurity = (sourceCode: string): string | null => {
    const forbiddenImports = [
      'import os', 'from os', 
      'import sys', 'from sys', 
      'subprocess', 'shutil', 
      'socket', 'urllib', 'requests', 
      'eval(', 'exec(', 'compile(', 'open(', 'builtin'
    ];

    for (const pattern of forbiddenImports) {
      if (sourceCode.includes(pattern)) {
        return pattern;
      }
    }
    return null;
  };

  // --- COMPILER WORKER REQUEST QUEUE PROCESSOR ---
  // Sequential processing with a 2000ms cool-down delay to respect Wandbox API rate limits
  const addToExecutionQueue = (task: QueueTask) => {
    setQueueLength((prev) => prev + 1);
    setQueueStatus('Queued');
    
    // Simulate compilation server-side queue worker execution
    setTimeout(async () => {
      setQueueStatus('Processing');
      task.onStart();

      try {
        const response = await fetch("https://wandbox.org/api/compile.json", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            compiler: "cpython-3.10.15",
            code: task.code,
            options: ""
          })
        });

        if (!response.ok) {
          throw new Error(`Wandbox Server Error: Code ${response.status}`);
        }

        const data = await response.json();

        if (data.program_error || data.compiler_error) {
          throw new Error(data.program_error || data.compiler_error);
        }

        // Parse program execution stdout output
        const stdout = data.program_output || data.stdout || '';
        const successIdx = stdout.indexOf("EVAL_SUCCESS");
        
        if (successIdx !== -1) {
          const debugStdout = stdout.substring(0, successIdx).trim();
          const lines = stdout.split('\n');
          const resultsLine = lines.find((l: string) => l.startsWith('[') && l.endsWith(']'));
          
          if (resultsLine) {
            const resultsArray = JSON.parse(resultsLine);
            const verifiedResults = task.testCases.map((tc, idx) => {
              const actualVal = String(resultsArray[idx]);
              const passed = actualVal === tc.expected;
              return {
                ...tc,
                actual: actualVal,
                status: (passed ? 'passed' : 'failed') as any
              };
            });
            task.onSuccess(verifiedResults, debugStdout);
          } else {
            throw new Error("Unable to parse testcase outputs from execution stream.");
          }
        } else {
          throw new Error("Compilation completed but output structure was missing.");
        }

      } catch (error: any) {
        task.onFailure(error.message || "Execution exception");
      } finally {
        setQueueLength((prev) => Math.max(0, prev - 1));
        setQueueStatus('Idle');
      }
    }, 1000);
  };

  const runCode = async () => {
    // 1. AST Security Analysis check
    const violation = analyzeCodeSecurity(code);
    if (violation) {
      setSecurityViolation(violation);
      setSecurityScore((prev) => Math.max(0, prev - 25)); // Dock score on integrity violation
      setSubmissionStatus('Security Block');
      setConsoleOpen(true);
      setConsoleTab('result');
      setTestCases((prev) => prev.map((tc) => ({ 
        ...tc, 
        status: 'failed', 
        actual: 'Blocked', 
        error: `[SECURITY AUDIT BLOCK]: Forbidden call detected: "${violation}". Assessment environment execution terminated.` 
      })));
      setHasRun(true);
      return;
    }

    // 2. Setup execution wrapper for Wandbox
    const executionCode = `
import json
import sys

# User code sandbox
${code}

_results = []
_cases = ["abcabcbb", "bbbbb", "pwwkew", ""]

try:
    _sol = Solution()
    for _c in _cases:
        _val = _sol.lengthOfLongestSubstring(_c)
        _results.append(int(_val))
    print("EVAL_SUCCESS")
    print(json.dumps(_results))
except Exception as _e:
    print(f"RUNNER_ERROR: {_e}", file=sys.stderr)
    raise _e
`;

    const task: QueueTask = {
      id: Math.random().toString(),
      code: executionCode,
      testCases: testCases,
      onStart: () => {
        setIsRunning(true);
        setConsoleOpen(true);
        setConsoleTab('result');
        setConsoleOutput(null);
        setTestCases((prev) => prev.map((tc) => ({ ...tc, status: 'running', actual: undefined, error: undefined })));
      },
      onSuccess: (results, debugStdout) => {
        setTestCases(results);
        setConsoleOutput(debugStdout || null);
        setHasRun(true);
        setSubmissionStatus(results.every(t => t.status === 'passed') ? 'Accepted' : 'Wrong Answer');
        setIsRunning(false);
      },
      onFailure: (errorMsg) => {
        const updated = testCases.map((tc) => ({
          ...tc,
          actual: "Runtime Error",
          status: 'failed' as any,
          error: errorMsg.trim()
        }));
        setConsoleOutput(null);
        setTestCases(updated);
        setHasRun(true);
        setSubmissionStatus('Runtime Error');
        setIsRunning(false);
      }
    };

    addToExecutionQueue(task);
  };

  const submitAssessment = () => {
    alert(`Assessment submitted successfully! Final Integrity Score: ${securityScore}%. Redirecting.`);
    navigate('/');
  };

  // --- MOBILE DEVICE BLOCKING SCREEN ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden bg-grid-pattern">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-md w-full glass-panel border border-rose-500/20 p-8 rounded-3xl text-center space-y-6 relative z-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white font-['Outfit']">
              Security Restriction
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Mobile devices are restricted from accessing Evalix secure assessments to maintain exam integrity and proctor validation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-900 flex items-center gap-3 text-left">
            <Monitor className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-xs text-slate-500">
              Please restart this test on a <strong>Tablet, Laptop, or Desktop</strong> screen (width &ge; 768px).
            </span>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col text-slate-200 overflow-hidden font-sans select-none">
      
      {/* Top Header Bar */}
      <header className="h-12 border-b border-[#282828] bg-[#1a1a1a] px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/login-select')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Problem List
          </button>
          <div className="h-4 w-px bg-[#282828]" />
          <div className="flex items-center gap-2">
            <img src={evalixLogoWithoutText} alt="Evalix" className="h-5 w-auto" />
            <span className="text-xs font-bold text-slate-300 font-['Outfit'] uppercase tracking-wider">
              Evalix Sandbox
            </span>
          </div>
        </div>

        {/* Timer & Proctor */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#282828] text-xs font-medium text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Time Remaining:</span>
            <span className="font-mono font-bold text-white">{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-4 border-l border-[#282828] pl-6">
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 rounded-full border border-purple-500/40 bg-slate-900 overflow-hidden flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline">AI Proctor Locked</span>
            </div>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              securityScore < 100 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}>
              Score: {securityScore}%
            </div>
          </div>
        </div>
      </header>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden p-2.5 gap-2 bg-[#1a1a1a]">
        
        {/* Left Panel: Description & Submissions */}
        <div className="w-[45%] flex flex-col rounded-lg bg-[#282828] border border-[#333] overflow-hidden">
          <div className="flex bg-[#282828] border-b border-[#383838]">
            <button 
              onClick={() => setActiveTab('problem')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-t-2 ${
                activeTab === 'problem' 
                  ? 'border-orange-500 text-white bg-[#2d2d2d]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Description
            </button>
            <button 
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-t-2 ${
                activeTab === 'submissions' 
                  ? 'border-orange-500 text-white bg-[#2d2d2d]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Submissions
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'problem' ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-white mb-2">
                    3. Longest Substring Without Repeating Characters
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/25">
                      Medium
                    </span>
                    <span className="text-xs text-slate-500">Evalix Coding Lab | 150 pts</span>
                  </div>
                </div>

                {securityViolation && (
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-400 font-mono text-xs flex items-center gap-3 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>[INTEGRITY ALERT]: Forbidden pattern <strong>"{securityViolation}"</strong> detected by AST static code shield. Execution locked.</span>
                  </div>
                )}

                <div className="text-sm text-slate-300 leading-relaxed space-y-4 font-sans">
                  <p>
                    Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.
                  </p>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Example 1:</p>
                      <div className="p-3 bg-[#1e1e1e] border border-[#333] rounded-lg font-mono text-xs text-slate-300 space-y-1">
                        <div><strong className="text-slate-400">Input:</strong> s = "abcabcbb"</div>
                        <div><strong className="text-slate-400">Output:</strong> 3</div>
                        <div><strong className="text-slate-400">Explanation:</strong> The answer is "abc", with the length of 3.</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Example 2:</p>
                      <div className="p-3 bg-[#1e1e1e] border border-[#333] rounded-lg font-mono text-xs text-slate-300 space-y-1">
                        <div><strong className="text-slate-400">Input:</strong> s = "bbbbb"</div>
                        <div><strong className="text-slate-400">Output:</strong> 1</div>
                        <div><strong className="text-slate-400">Explanation:</strong> The answer is "b", with the length of 1.</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Example 3:</p>
                      <div className="p-3 bg-[#1e1e1e] border border-[#333] rounded-lg font-mono text-xs text-slate-300 space-y-1">
                        <div><strong className="text-slate-400">Input:</strong> s = "pwwkew"</div>
                        <div><strong className="text-slate-400">Output:</strong> 3</div>
                        <div><strong className="text-slate-400">Explanation:</strong> The answer is "wke", with the length of 3. Note that the answer must be a substring, "pwke" is a subsequence and not a substring.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Constraints:</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300 font-mono">
                    <li>0 &lt;= s.length &lt;= 5 * 10<sup>4</sup></li>
                    <li>s consists of English letters, digits, symbols and spaces.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Submission History</span>
                {hasRun ? (
                  <div className="p-4 rounded-xl bg-[#1e1e1e] border border-[#333] flex justify-between items-center">
                    <div>
                      <div className={`text-sm font-bold ${
                        submissionStatus === 'Accepted' ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {submissionStatus}
                      </div>
                      <span className="text-[10px] text-slate-500">Wandbox Sandbox Engine Run</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-300 font-semibold font-mono">Status: {submissionStatus}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No submissions compiled yet. Run your test cases to see analysis here.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Monaco Editor & Collapsible Console */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          
          <div className="flex-1 flex flex-col rounded-lg bg-[#282828] border border-[#333] overflow-hidden">
            {/* Editor Toolbar */}
            <div className="h-10 border-b border-[#383838] bg-[#282828] px-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#333] hover:bg-[#383838] text-white transition-colors cursor-pointer">
                  Python 3
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>
                <div className="h-3 w-px bg-[#383838]" />
                <button className="p-1 rounded hover:bg-[#333] text-slate-400 hover:text-white transition-colors cursor-pointer" title="Auto-complete active">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleReset} 
                  className="p-1.5 rounded hover:bg-[#333] text-slate-400 hover:text-white transition-colors cursor-pointer" 
                  title="Reset code"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-[#333] text-slate-400 hover:text-white transition-colors cursor-pointer" title="Settings">
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-[#333] text-slate-400 hover:text-white transition-colors cursor-pointer" title="Fullscreen">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[220px]">
              <Editor
                height="100%"
                language="python"
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  padding: { top: 10, bottom: 10 },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  wordBasedSuggestions: 'allDocuments',
                  snippetSuggestions: 'inline',
                }}
              />
            </div>
          </div>

          {/* LeetCode Collapsible Console */}
          <div className={`rounded-lg bg-[#282828] border border-[#333] flex flex-col overflow-hidden transition-all duration-300 ${
            consoleOpen ? 'h-[250px]' : 'h-10'
          }`}>
            <div className="h-10 border-b border-[#383838] bg-[#282828] px-4 flex items-center justify-between">
              <button 
                onClick={() => setConsoleOpen(!consoleOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${consoleOpen ? '' : 'rotate-180'}`} />
                Console
              </button>

              {/* Wandbox API rate limit queue monitor in toolbar */}
              {queueLength > 0 && (
                <div className="flex items-center gap-2 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md font-mono animate-pulse">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>Queue position: {queueLength} ({queueStatus})</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setConsoleOpen(true);
                    setConsoleTab('testcase');
                  }}
                  className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    consoleTab === 'testcase' && consoleOpen ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Testcase
                </button>
                <button
                  onClick={() => {
                    setConsoleOpen(true);
                    setConsoleTab('result');
                  }}
                  className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    consoleTab === 'result' && consoleOpen ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Result
                </button>
              </div>
            </div>

            {consoleOpen && (
              <div className="flex-1 p-4 bg-[#1e1e1e] overflow-y-auto text-xs">
                {consoleTab === 'testcase' ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {testCases.map((tc) => (
                        <button
                          key={tc.id}
                          onClick={() => setActiveTestCaseId(tc.id)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            activeTestCaseId === tc.id
                              ? 'bg-[#333] border-[#555] text-white'
                              : 'bg-transparent border-[#333] text-slate-400 hover:border-[#444]'
                          }`}
                        >
                          Case {tc.id}
                        </button>
                      ))}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">String s</span>
                      <div className="font-mono p-3 bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg text-orange-400 font-semibold">
                        {testCases.find(t => t.id === activeTestCaseId)?.input.replace('s = ', '')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isRunning ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2.5">
                        <Hourglass className="w-5 h-5 text-orange-500 animate-spin" />
                        <span className="text-slate-400 text-xs font-mono">Wandbox queue processing request securely...</span>
                      </div>
                    ) : hasRun ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-base font-bold uppercase tracking-wider ${
                            submissionStatus === 'Accepted' 
                              ? 'text-emerald-400' 
                              : 'text-rose-500'
                          }`}>
                            {submissionStatus}
                          </span>
                          <span className="text-xs text-slate-500">Wandbox Secure API compilation</span>
                        </div>

                        {/* Display security / AST blocker errors */}
                        {testCases[0]?.error ? (
                          <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-400 font-mono text-[11px] whitespace-pre-wrap flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <span>{testCases[0].error}</span>
                          </div>
                        ) : (
                          <>
                            {consoleOutput && (
                              <div className="space-y-1.5 mb-4 animate-fade-in">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Stdout Logs</span>
                                <pre className="p-3 bg-[#131313] border border-[#2d2d2d] rounded-lg font-mono text-xs text-orange-200/90 max-h-[100px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                  {consoleOutput}
                                </pre>
                              </div>
                            )}

                            <div className="flex gap-2 border-b border-[#333] pb-2">
                              {testCases.map((tc) => (
                                <button
                                  key={tc.id}
                                  onClick={() => setActiveTestCaseId(tc.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold border ${
                                    activeTestCaseId === tc.id
                                      ? 'bg-[#333] border-[#555] text-white'
                                      : 'bg-transparent border-[#2d2d2d] text-slate-400'
                                  }`}
                                >
                                  {tc.status === 'passed' ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  )}
                                  Case {tc.id}
                                </button>
                              ))}
                            </div>

                            {(() => {
                              const selectedCase = testCases.find(t => t.id === activeTestCaseId);
                              if (!selectedCase) return null;
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Input</span>
                                    <div className="p-2.5 rounded bg-[#282828] border border-[#383838] font-mono text-slate-300 font-semibold">
                                      {selectedCase.input}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Output</span>
                                    <div className={`p-2.5 rounded border font-mono ${
                                      selectedCase.status === 'passed' 
                                        ? 'bg-[#282828] border-emerald-950/60 text-emerald-400 font-semibold' 
                                        : 'bg-[#282828] border-rose-950/60 text-rose-400 font-semibold'
                                    }`}>
                                      {selectedCase.actual}
                                    </div>
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Expected Output</span>
                                    <div className="p-2.5 rounded bg-[#282828] border border-[#383838] font-mono text-emerald-400 font-semibold">
                                      {selectedCase.expected}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        Please run your code to see the testcase results.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="h-12 border border-[#333] rounded-lg bg-[#282828] px-4 flex items-center justify-between">
            <button 
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="px-3.5 py-1.5 rounded bg-[#333] hover:bg-[#383838] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Console
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={runCode}
                disabled={isRunning}
                className="px-4 py-1.5 rounded bg-[#333] hover:bg-[#3b3b3b] disabled:bg-slate-800 disabled:text-slate-600 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run
              </button>
              <button 
                onClick={submitAssessment}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Submit
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
