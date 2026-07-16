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
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Code2,
  Lock,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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

interface Question {
  id: string;
  title: string;
  type: 'mcq' | 'coding';
  points: number;
  completed: boolean;
  mcqQuestion?: string;
  options?: string[];
  selectedOption?: number; // 0-indexed index of selected option
  starterCode?: string;
  testCases?: any[];
  correctOptionIndex?: number;
}

const initialQuestions: Question[] = [
  {
    id: 'mcq-1',
    title: '1. XSS & Clickjacking Shield',
    type: 'mcq',
    points: 20,
    completed: false,
    mcqQuestion: 'Which of the following response headers is designed to mitigate Cross-Site Scripting (XSS) and clickjacking vectors by enforcing strict origins for scripts, styles, and frames?',
    options: [
      'A) X-Content-Type-Options: nosniff',
      'B) Strict-Transport-Security: max-age=31536000',
      'C) Content-Security-Policy (CSP)',
      'D) Access-Control-Allow-Origin: *'
    ]
  },
  {
    id: 'mcq-2',
    title: '2. Python Shell Injection',
    type: 'mcq',
    points: 20,
    completed: false,
    mcqQuestion: 'Which of the following is considered the most secure way to run shell commands in Python to prevent OS Command Injection vulnerabilities?',
    options: [
      'A) Utilizing os.system("command " + input_param)',
      'B) Executing subprocess.run(arguments_list, shell=False) with parameterized inputs',
      'C) Spawning shells using os.popen() with sanitized variables',
      'D) Feeding strings into the eval() interpreter dynamically'
    ]
  },
  {
    id: 'mcq-3',
    title: '3. SameSite Cookie Directives',
    type: 'mcq',
    points: 20,
    completed: false,
    mcqQuestion: 'When configuring session cookies, what behavior does the SameSite="Strict" attribute enforce?',
    options: [
      'A) Cookies are sent only on secure HTTPS connections.',
      'B) Cookies are blocked on cross-site requests, including all standard top-level redirects/links.',
      'C) JavaScript is prevented from accessing the cookie object via document.cookie.',
      'D) The cookie expires immediately when the browser window closes.'
    ]
  },
  {
    id: 'coding-1',
    title: '4. Non-Repeating Substring',
    type: 'coding',
    points: 150,
    completed: false,
    starterCode: pythonTemplate,
    testCases: initialTestCases
  }
];



interface QueueTask {
  id: string;
  code: string;
  testCases: TestCase[];
  onStart: () => void;
  onSuccess: (results: TestCase[], debugStdout: string) => void;
  onFailure: (error: string) => void;
}

// --- SECURE CRYPTOGRAPHIC SHIELD HELPERS (Obfuscation for Hackathon Security Validation) ---
// Prevents simple inspection/manipulation of client exam answers in localstorage plaintext
const encryptData = (data: any): string => {
  const plaintext = JSON.stringify(data);
  // Base64 + simple char shifts (XOR-equivalent shift) for state obfuscation
  const key = 42;
  const shifted = Array.from(plaintext)
    .map(c => String.fromCharCode(c.charCodeAt(0) ^ key))
    .join('');
  return btoa(unescape(encodeURIComponent(shifted)));
};

const decryptData = (ciphertext: string): any => {
  try {
    const raw = decodeURIComponent(escape(atob(ciphertext)));
    const key = 42;
    const decrypted = Array.from(raw)
      .map(c => String.fromCharCode(c.charCodeAt(0) ^ key))
      .join('');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
};

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Proctoring States
  const [isStarted, setIsStarted] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Overall exam states
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('mcq-1');
  
  // MCQ Answer tracking
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Coding sandbox states
  const [code, setCode] = useState(pythonTemplate);
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [activeTestCaseId, setActiveTestCaseId] = useState<number>(1);
  const [securityScore, setSecurityScore] = useState(100);
  const [hasRun, setHasRun] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Security Block' | 'Disqualified' | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [securityViolation, setSecurityViolation] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [examBreakdown, setExamBreakdown] = useState({
    mcqScore: 0,
    mcqMax: 0,
    codingScore: 0,
    codingMax: 0,
    integrityScore: 100,
    totalScore: 0,
    totalMax: 0
  });
  const [focusWarning, setFocusWarning] = useState(false);

  // Clock state
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour

  // Device & Size Check State (Security Blocking for Mobile Users)
  const [isMobile, setIsMobile] = useState(false);

  // Queue state tracking
  const [queueLength, setQueueLength] = useState(0);
  const [queueStatus, setQueueStatus] = useState<string>('Idle');

  // References to handle closures securely in listeners
  const isStartedRef = React.useRef(isStarted);
  const isDisqualifiedRef = React.useRef(isDisqualified);
  const tabSwitchCountRef = React.useRef(tabSwitchCount);
  const submissionIdRef = React.useRef(submissionId);
  const securityScoreRef = React.useRef(securityScore);

  React.useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  React.useEffect(() => {
    isDisqualifiedRef.current = isDisqualified;
  }, [isDisqualified]);

  React.useEffect(() => {
    tabSwitchCountRef.current = tabSwitchCount;
  }, [tabSwitchCount]);

  React.useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  React.useEffect(() => {
    securityScoreRef.current = securityScore;
  }, [securityScore]);

  const startSecureSubmission = async () => {
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const currentTestObj = localStorage.getItem('evalix_current_test');
      if (!currentTestObj) {
        toast.error("No active secure test configuration found.");
        return;
      }
      const test = JSON.parse(currentTestObj);
      const response = await fetch("http://localhost:3000/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ assessmentId: test._id })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmissionId(data.submission._id);
        if (data.submission.status === 'submitted' || data.submission.status === 'evaluated') {
          setIsDisqualified(true);
          toast.error("You have already submitted this assessment.");
        }
      } else {
        throw new Error(data.message || "Failed to initialize secure session");
      }
    } catch (err: any) {
      toast.error(err.message || "Security session initialization failed.");
    }
  };

  const recordProctorEvent = async (eventType: string, metadata: any = {}) => {
    try {
      const currentSubId = submissionIdRef.current;
      if (!currentSubId) return;
      const token = localStorage.getItem('evalix_auth_token');
      await fetch(`http://localhost:3000/proctor/submissions/${currentSubId}/proctor-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ eventType, metadata })
      });
    } catch (err) {
      console.error("Proctor event upload failure:", err);
    }
  };

  const syncSubmissionToBackend = async (finalStatus: string = 'submitted', calculatedScore?: number) => {
    try {
      const currentSubId = submissionIdRef.current;
      if (!currentSubId) return;
      const token = localStorage.getItem('evalix_auth_token');

      // Calculate scores
      let mcqScore = 0;
      questions.forEach(q => {
        if (q.type === 'mcq') {
          let isCorrect = false;
          if (q.correctOptionIndex !== undefined) {
            isCorrect = q.selectedOption === q.correctOptionIndex;
          } else {
            if (q.id === 'mcq-1') isCorrect = q.selectedOption === 2;
            if (q.id === 'mcq-2') isCorrect = q.selectedOption === 1;
            if (q.id === 'mcq-3') isCorrect = q.selectedOption === 1;
          }
          if (isCorrect) mcqScore += q.points;
        }
      });

      const formattedAnswers = questions.map(q => ({
        questionId: q.id.includes('-') ? "6a588dfb315654fbef121e04" : q.id, // safe ObjectID fallback if mock format
        answer: q.type === 'mcq' ? String(q.selectedOption ?? '') : q.starterCode || '',
        isCorrect: q.type === 'mcq' ? (q.selectedOption === q.correctOptionIndex) : false,
        scoreAwarded: q.type === 'mcq' ? (q.selectedOption === q.correctOptionIndex ? q.points : 0) : 0
      }));

      const body = {
        answers: formattedAnswers,
        totalScore: calculatedScore !== undefined ? calculatedScore : mcqScore,
        status: finalStatus,
        aiReport: {
          riskScore: 100 - securityScoreRef.current,
          flags: [
            { type: 'violations', count: tabSwitchCountRef.current, severity: tabSwitchCountRef.current > 1 ? 'high' : 'medium' }
          ]
        }
      };

      await fetch(`http://localhost:3000/submissions/${currentSubId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.error("Failed to sync submission to DB:", err);
    }
  };

  const handleDisqualification = async () => {
    setIsDisqualified(true);
    setSubmissionStatus('Disqualified');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    await syncSubmissionToBackend('evaluated');
    localStorage.removeItem('evalix_exam_progress_secure');
    localStorage.removeItem('evalix_current_test');
    toast.error("🚨 You have been disqualified from this test.", { duration: 8000 });
  };

  // 1. Viewport screen-size restriction
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 2. Load progress securely from LocalStorage and dynamic test schema on mount
  useEffect(() => {
    startSecureSubmission();
    let initialMappedQuestions: Question[] = [];
    const rawTest = localStorage.getItem('evalix_current_test');
    if (rawTest) {
      try {
        const test = JSON.parse(rawTest);
        if (test && test.questions && test.questions.length > 0) {
          initialMappedQuestions = test.questions.map((q: any, idx: number) => {
            const isMcq = q.type === 'mcq';
            return {
              id: isMcq ? `mcq-${idx}` : `coding-${idx}`,
              title: `${idx + 1}. ${isMcq ? 'Multiple Choice' : 'Sandbox Assignment'}`,
              type: q.type,
              points: q.marks || (isMcq ? 10 : 20),
              completed: false,
              mcqQuestion: isMcq ? q.text : undefined,
              options: isMcq ? q.options : undefined,
              starterCode: !isMcq ? q.starterCode : undefined,
              testCases: !isMcq ? q.testCases : undefined
            };
          });
        }
      } catch (err) {
        console.error("Error mapping dynamic test:", err);
      }
    }

    const savedState = localStorage.getItem('evalix_exam_progress_secure');
    if (savedState) {
      const decoded = decryptData(savedState);
      if (decoded) {
        if (decoded.questions) setQuestions(decoded.questions);
        if (decoded.code) setCode(decoded.code);
        if (decoded.securityScore) setSecurityScore(decoded.securityScore);
        if (decoded.timeLeft) setTimeLeft(decoded.timeLeft);
        
        // Sync selected option if current is MCQ
        const activeQ = decoded.questions.find((q: Question) => q.id === currentQuestionId);
        if (activeQ && activeQ.selectedOption !== undefined) {
          setSelectedOption(activeQ.selectedOption);
        }
      }
    } else if (initialMappedQuestions.length > 0) {
      setQuestions(initialMappedQuestions);
      setCurrentQuestionId(initialMappedQuestions[0].id);
      
      const firstQ = initialMappedQuestions[0];
      if (firstQ.type === 'coding') {
        setCode(firstQ.starterCode || pythonTemplate);
        if (firstQ.testCases) {
          const tc = firstQ.testCases.map((c: any, cIdx: number) => ({
            id: cIdx + 1,
            input: c.input,
            expected: c.expectedOutput,
            status: 'idle' as 'idle'
          }));
          setTestCases(tc);
        }
      }
    }
  }, []);

  // 3. Save progress securely on State updates
  const saveStateSecurely = (updatedQuestions: Question[], currentCode: string) => {
    const stateObj = {
      questions: updatedQuestions,
      code: currentCode,
      securityScore,
      timeLeft
    };
    localStorage.setItem('evalix_exam_progress_secure', encryptData(stateObj));
  };

  // Sync Timer to state and secure localstorage
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev > 0 ? prev - 1 : 0;
        // Save time to localstorage periodically
        if (nextTime % 10 === 0) {
          const savedState = localStorage.getItem('evalix_exam_progress_secure');
          if (savedState) {
            const decoded = decryptData(savedState);
            if (decoded) {
              decoded.timeLeft = nextTime;
              localStorage.setItem('evalix_exam_progress_secure', encryptData(decoded));
            }
          }
        }
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync selectedOption when switching questions
  useEffect(() => {
    const currentQ = questions.find(q => q.id === currentQuestionId);
    if (currentQ) {
      if (currentQ.type === 'mcq') {
        setSelectedOption(currentQ.selectedOption !== undefined ? currentQ.selectedOption : null);
      } else if (currentQ.type === 'coding') {
        setCode(currentQ.starterCode || pythonTemplate);
        if (currentQ.testCases) {
          const tc = currentQ.testCases.map((c: any, cIdx: number) => ({
            id: cIdx + 1,
            input: c.input,
            expected: c.expectedOutput || c.expected,
            status: 'idle' as 'idle'
          }));
          setTestCases(tc);
        }
      }
    }
  }, [currentQuestionId]);

  // --- EXAM INTEGRITY & ANTI-CHEAT SHIELD ---
  useEffect(() => {
    if (!isStarted || isDisqualified) return;

    // Helper to dock security score
    const dockScore = (amount: number = 10) => {
      setSecurityScore(prev => Math.max(0, prev - amount));
    };

    // Generic violation handler (tab switches, window focus losses, fullscreen exits)
    const handleViolation = (reason: string, type: 'tab_switch' | 'window_blur' | 'fullscreen_exit', amount = 15) => {
      if (isDisqualifiedRef.current) return;

      const nextCount = tabSwitchCountRef.current + 1;
      setTabSwitchCount(nextCount);
      dockScore(amount);
      
      // Upload telemetry event to backend DB in real time
      recordProctorEvent(type, { reason, violationNumber: nextCount });

      if (nextCount === 1) {
        setShowWarningModal(true);
        toast.error(`⚠️ Proctor Warning: ${reason} logged. Second violation will disqualify you!`, {
          duration: 6000,
          style: { background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }
        });
      } else if (nextCount >= 2) {
        handleDisqualification();
      }
    };

    // 1. Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordProctorEvent('right_click', { reason: 'Right click attempt' });
      toast.error('⚠️ Right-click is disabled in secure exam sandbox.', { duration: 3000 });
    };

    // 2. Block copy / cut / paste events globally (with unlimited attempts, toast alert, no DQ)
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      recordProctorEvent('copy_attempt', { reason: 'Copy attempt' });
      toast.error('⚠️ Clipboard Action Blocked: Copying is disabled.', { duration: 3000 });
    };
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      recordProctorEvent('copy_attempt', { reason: 'Cut attempt' });
      toast.error('⚠️ Clipboard Action Blocked: Cutting is disabled.', { duration: 3000 });
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      recordProctorEvent('paste_attempt', { reason: 'Paste attempt' });
      toast.error('⚠️ Clipboard Action Blocked: Pasting is disabled.', { duration: 3000 });
    };

    // 3. Block DevTools keyboard shortcuts + Ctrl+V paste at keyboard level
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPaste = (e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'V';
      const isCopy = (e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'C';
      const isCut = (e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'X';
      
      const blocked =
        e.key === 'F12' ||
        isPaste ||
        isCopy ||
        isCut ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K', 'U'].includes(e.key.toUpperCase())) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U');

      if (blocked) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (isPaste) {
          recordProctorEvent('paste_attempt', { reason: 'Ctrl+V paste attempt' });
          toast.error('⚠️ Clipboard Action Blocked: Pasting is disabled.', { duration: 3000 });
        } else if (isCopy || isCut) {
          recordProctorEvent('copy_attempt', { reason: 'Keyboard copy attempt' });
          toast.error('⚠️ Clipboard Action Blocked: Copying/cutting is disabled.', { duration: 3000 });
        } else {
          recordProctorEvent('suspicious_activity', { reason: `DevTools keyboard shortcut: ${e.key}` });
          toast.error('⚠️ DevTools shortcuts are disabled in secure exam sandbox.', { duration: 3000 });
        }
      }
    };

    // 4. Detect DevTools via window resize fingerprint
    let devToolsOpen = false;
    const devToolsInterval = setInterval(() => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen = widthDiff > threshold || heightDiff > threshold;

      if (isOpen && !devToolsOpen) {
        devToolsOpen = true;
        dockScore(20);
        recordProctorEvent('suspicious_activity', { reason: 'DevTools panel open detected' });
        toast.error('⚠️ Secure sandbox alert: DevTools panel detected.', { duration: 4000 });
      } else if (!isOpen) {
        devToolsOpen = false;
      }
    }, 1500);

    // 5. Tab switch detection via Page Visibility API
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Tab switch or hidden browser window', 'tab_switch', 15);
        setFocusWarning(true);
      } else {
        setFocusWarning(false);
      }
    };

    // 6. Window blur detection (Alt+Tab, minimize, etc)
    let blurTimeout: ReturnType<typeof setTimeout>;
    const handleWindowBlur = () => {
      blurTimeout = setTimeout(() => {
        handleViolation('Window lost focus (Alt+Tab / application minimize)', 'window_blur', 15);
        setFocusWarning(true);
      }, 300);
    };

    const handleWindowFocus = () => {
      clearTimeout(blurTimeout);
      setFocusWarning(false);
    };

    // 7. Fullscreen exit detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isStartedRef.current && !isDisqualifiedRef.current) {
        handleViolation('Exited secure fullscreen mode', 'fullscreen_exit', 20);
      }
    };

    // Attach listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCut, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCut, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(devToolsInterval);
      clearTimeout(blurTimeout);
    };
  }, [isStarted, isDisqualified]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  // --- SAVE MCQ QUESTION RESPONSE ---
  const saveMCQAnswer = () => {
    if (selectedOption === null) {
      toast.error('Please select an option before saving.');
      return;
    }

    const updated = questions.map((q) => {
      if (q.id === currentQuestionId) {
        return {
          ...q,
          completed: true,
          selectedOption
        };
      }
      return q;
    });

    setQuestions(updated);
    saveStateSecurely(updated, code);
    toast.success('Response saved to sandbox state.');
  };

  // Static AST Scanner
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

  // FIFO request execution queue worker
  const addToExecutionQueue = (task: QueueTask) => {
    setQueueLength((prev) => prev + 1);
    setQueueStatus('Queued');
    
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
          throw new Error(`Sandbox Server Error: Code ${response.status}`);
        }

        const data = await response.json();

        if (data.program_error || data.compiler_error) {
          throw new Error(data.program_error || data.compiler_error);
        }

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
    // AST Check
    const violation = analyzeCodeSecurity(code);
    if (violation) {
      setSecurityViolation(violation);
      setSecurityScore((prev) => Math.max(0, prev - 25)); 
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

    // Extract list of inputs
    const casesListJson = JSON.stringify(testCases.map(tc => tc.input));

    // Try to guess how to instantiate and invoke the code
    let callSnippet = '';
    const classMatch = code.match(/class\s+(\w+)/);
    const defMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)/);

    if (classMatch) {
      const className = classMatch[1];
      const methodName = defMatch ? defMatch[1] : 'solve';
      callSnippet = `
    _sol = ${className}()
    for _c in _cases:
        if "," in _c and "=" in _c:
            _loc = {}
            exec(_c, {}, _loc)
            _val = getattr(_sol, "${methodName}")(**_loc)
        elif "," in _c:
            _args = eval("(" + _c + ")")
            if isinstance(_args, tuple):
                _val = getattr(_sol, "${methodName}")(*_args)
            else:
                _val = getattr(_sol, "${methodName}")(_args)
        else:
            try:
                _parsed = eval(_c)
            except:
                _parsed = _c
            _val = getattr(_sol, "${methodName}")(_parsed)
        _results.append(_val)
      `;
    } else if (defMatch) {
      const funcName = defMatch[1];
      callSnippet = `
    for _c in _cases:
        if "," in _c and "=" in _c:
            _loc = {}
            exec(_c, {}, _loc)
            _val = ${funcName}(**_loc)
        elif "," in _c:
            _args = eval("(" + _c + ")")
            if isinstance(_args, tuple):
                _val = ${funcName}(*_args)
            else:
                _val = ${funcName}(_args)
        else:
            try:
                _parsed = eval(_c)
            except:
                _parsed = _c
            _val = ${funcName}(_parsed)
        _results.append(_val)
      `;
    } else {
      callSnippet = `
    _sol = Solution()
    for _c in _cases:
        _val = _sol.lengthOfLongestSubstring(_c)
        _results.append(_val)
      `;
    }

    const executionCode = `
import json
import sys

# User code sandbox
${code}

_results = []
_cases = ${casesListJson}

try:
${callSnippet}
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
        
        // Save Coding question progress
        const updated = questions.map(q => q.id === 'coding-1' ? { ...q, completed: true } : q);
        setQuestions(updated);
        saveStateSecurely(updated, code);
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

  const submitAssessment = async () => {
    toast.loading("Running final verification cases... Please hold.", { id: "submit-exam" });

    // 1. Run coding question compiler if available
    let codingPassRatio = 1.0; 
    const codingQ = questions.find(q => q.type === 'coding');

    if (codingQ && testCases.length > 0) {
      try {
        const casesListJson = JSON.stringify(testCases.map(tc => tc.input));
        let callSnippet = '';
        const classMatch = code.match(/class\s+(\w+)/);
        const defMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)/);

        if (classMatch) {
          const className = classMatch[1];
          const methodName = defMatch ? defMatch[1] : 'solve';
          callSnippet = `
    _sol = ${className}()
    for _c in _cases:
        if "," in _c and "=" in _c:
            _loc = {}
            exec(_c, {}, _loc)
            _val = getattr(_sol, "${methodName}")(**_loc)
        elif "," in _c:
            _args = eval("(" + _c + ")")
            if isinstance(_args, tuple):
                _val = getattr(_sol, "${methodName}")(*_args)
            else:
                _val = getattr(_sol, "${methodName}")(_args)
        else:
            try:
                _parsed = eval(_c)
            except:
                _parsed = _c
            _val = getattr(_sol, "${methodName}")(_parsed)
        _results.append(_val)
          `;
        } else if (defMatch) {
          const funcName = defMatch[1];
          callSnippet = `
    for _c in _cases:
        if "," in _c and "=" in _c:
            _loc = {}
            exec(_c, {}, _loc)
            _val = ${funcName}(**_loc)
        elif "," in _c:
            _args = eval("(" + _c + ")")
            if isinstance(_args, tuple):
                _val = ${funcName}(*_args)
            else:
                _val = ${funcName}(_args)
        else:
            try:
                _parsed = eval(_c)
            except:
                _parsed = _c
            _val = ${funcName}(_parsed)
        _results.append(_val)
          `;
        }

        const executionCode = `
import json
import sys

${code}

_results = []
_cases = ${casesListJson}

try:
${callSnippet}
    print("EVAL_SUCCESS")
    print(json.dumps(_results))
except Exception as _e:
    print(f"RUNNER_ERROR: {_e}", file=sys.stderr)
    raise _e
        `;

        const response = await fetch("https://wandbox.org/api/compile.json", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            compiler: "cpython-3.10.15",
            code: executionCode,
            options: ""
          })
        });

        if (response.ok) {
          const data = await response.json();
          const stdout = data.program_output || data.stdout || '';
          const successIdx = stdout.indexOf("EVAL_SUCCESS");
          if (successIdx !== -1) {
            const lines = stdout.substring(successIdx).split('\n');
            const resultsLine = lines.find((l: string) => l.trim().startsWith('[') && l.trim().endsWith(']'));
            if (resultsLine) {
              const resultsArray = JSON.parse(resultsLine);
              let passed = 0;
              testCases.forEach((tc, idx) => {
                if (String(resultsArray[idx]) === tc.expected) {
                  passed++;
                }
              });
              codingPassRatio = passed / testCases.length;
            }
          }
        }
      } catch (err) {
        console.error("Submission verification compile failed:", err);
        codingPassRatio = 0;
      }
    }

    // 2. Compute MCQ scores
    let mcqScore = 0;
    let mcqMax = 0;
    
    questions.forEach(q => {
      if (q.type === 'mcq') {
        mcqMax += q.points;
        let isCorrect = false;
        
        if (q.correctOptionIndex !== undefined) {
          isCorrect = q.selectedOption === q.correctOptionIndex;
        } else {
          if (q.id === 'mcq-1') isCorrect = q.selectedOption === 2;
          if (q.id === 'mcq-2') isCorrect = q.selectedOption === 1;
          if (q.id === 'mcq-3') isCorrect = q.selectedOption === 1;
        }

        if (isCorrect) {
          mcqScore += q.points;
        }
      }
    });

    // 3. Compute Coding scores
    let codingScore = 0;
    let codingMax = 0;
    questions.forEach(q => {
      if (q.type === 'coding') {
        codingMax += q.points;
        codingScore += Math.round(codingPassRatio * q.points);
      }
    });

    const totalScore = mcqScore + codingScore;
    const totalMax = mcqMax + codingMax;

    setExamBreakdown({
      mcqScore,
      mcqMax,
      codingScore,
      codingMax,
      integrityScore: securityScore,
      totalScore,
      totalMax
    });

    toast.dismiss("submit-exam");
    toast.success("Evaluation complete! Detailed scoreboard loaded.");

    await syncSubmissionToBackend('submitted', totalScore);
    localStorage.removeItem('evalix_exam_progress_secure');
    localStorage.removeItem('evalix_current_test');

    setShowScoreModal(true);
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
            <h1 className="text-xl font-bold text-white font-['Outfit']">Security Restriction</h1>
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

  if (isDisqualified) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden bg-grid-pattern text-slate-100">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-md w-full glass-panel border border-rose-500/20 p-8 rounded-3xl text-center space-y-6 relative z-10 shadow-2xl bg-[#140505]">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white font-['Outfit']">Test Session Disqualified</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              You have been disqualified from this assessment due to multiple proctoring violations (tab switching, window focus loss, or fullscreen exits).
            </p>
            <p className="text-xs text-rose-500 font-medium">
              Your logs have been transmitted to the recruiter control center.
            </p>
          </div>
          <button 
            onClick={() => navigate('/candidate-dashboard')}
            className="w-full py-3.5 px-5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden bg-grid-pattern text-slate-100">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-lg w-full glass-panel border border-indigo-500/20 p-8 rounded-3xl space-y-6 relative z-10 shadow-2xl bg-[#090d1a]">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-extrabold text-white font-['Outfit'] tracking-tight">Secure Proctoring Activation</h1>
            <p className="text-xs text-slate-400">Please review the strict anti-cheating guidelines below before launching your secure test environment.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-900 space-y-4 text-xs leading-relaxed text-slate-300">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
              <p><strong>Fullscreen Enforcement:</strong> Exiting fullscreen mode once the test begins is prohibited.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
              <p><strong>Focus Monitoring:</strong> Switching tabs or windows (e.g., using Alt-Tab, minimizing, opening other apps) is prohibited.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
              <p><strong>Clipboard Control:</strong> Copying, cutting, and pasting are monitored. Paste attempts show toast warnings.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 shrink-0" />
              <p className="text-rose-400"><strong>Disqualification Policy:</strong> The first tab/window switch or fullscreen exit triggers a warning. A second occurrence will result in **immediate disqualification**.</p>
            </div>
          </div>

          <button
            onClick={async () => {
              await startSecureSubmission();
              document.documentElement.requestFullscreen().catch((err) => {
                console.error("Fullscreen request failed:", err);
              });
              setIsStarted(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
          >
            I Accept and Launch Secure Sandbox
          </button>
        </div>
      </div>
    );
  }

  const activeQuestion = questions.find(q => q.id === currentQuestionId);

  return (
    <div className="exam-secure-shell h-screen bg-[#1a1a1a] flex flex-col text-slate-200 overflow-hidden font-sans select-none">
      
      {/* Top Header Bar */}
      <header className="h-12 border-b border-[#282828] bg-[#1a1a1a] px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/login-select')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Portal
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
            {tabSwitchCount > 0 && (
              <div className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-500/10 border-amber-500/30 text-amber-400">
                Tab Switches: {tabSwitchCount}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Focus Warning Banner */}
      {focusWarning && (
        <div className="shrink-0 bg-rose-900/70 border-b border-rose-700/60 px-4 py-2 flex items-center gap-3 z-20 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-xs font-semibold text-rose-300">
            ⚠️ Proctor Alert: Window focus lost — return to the exam immediately. This violation has been logged.
          </span>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden bg-[#141414]">
        
        {/* Left Navigation Sidebar (Question progress dashboard) */}
        <aside className="w-64 border-r border-[#282828] bg-[#1a1a1a] flex flex-col justify-between shrink-0">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exam Questions</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                {questions.filter(q => q.completed).length} / {questions.length}
              </span>
            </div>

            {/* Questions Selection List */}
            <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionId(q.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    currentQuestionId === q.id
                      ? 'bg-indigo-600/10 border-indigo-500 text-white font-medium shadow-md shadow-indigo-600/5'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-[#252525] hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {q.type === 'mcq' ? (
                      <HelpCircle className={`w-4 h-4 shrink-0 ${currentQuestionId === q.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                    ) : (
                      <Code2 className={`w-4 h-4 shrink-0 ${currentQuestionId === q.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                    )}
                    <span className="text-xs truncate">{q.title}</span>
                  </div>

                  {q.completed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Footer Lock indicator */}
          <div className="p-4 border-t border-[#282828] bg-[#1e1e1e]/40 space-y-3">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Secure Sandboxed Environment</span>
            </div>
            <button
              onClick={submitAssessment}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Submit Exam Session
            </button>
          </div>
        </aside>

        {/* Right Workspace Main Pane */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeQuestion && activeQuestion.type === 'mcq' ? (
            
            // --- MCQ QUESTION SCREEN INTERFACE ---
            <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#151515] overflow-y-auto">
              <div className="max-w-2xl w-full glass-panel border border-[#333] p-8 rounded-3xl space-y-6 shadow-2xl relative">
                
                {/* MCQ Question Header */}
                <div className="flex justify-between items-start gap-4">
                  <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 font-mono">
                    MCQ Challenge | {activeQuestion.points} Points
                  </span>
                  {activeQuestion.completed && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Answer Saved
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-white leading-relaxed">
                  {activeQuestion.mcqQuestion}
                </h2>

                {/* MCQ Options list */}
                <div className="space-y-3 pt-2">
                  {activeQuestion.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                        selectedOption === idx
                          ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg'
                          : 'bg-[#1a1a1a]/60 border-[#2b2b2b] text-slate-300 hover:border-[#3a3a3a] hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedOption === idx ? 'border-indigo-500 bg-indigo-600' : 'border-slate-700 bg-transparent'
                      }`}>
                        {selectedOption === idx && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-sm font-medium">{opt}</span>
                    </button>
                  ))}
                </div>

                {/* Save Trigger Button */}
                <div className="flex justify-end pt-4 border-t border-[#282828]">
                  <button
                    onClick={saveMCQAnswer}
                    className="flex items-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Response
                  </button>
                </div>
              </div>
            </div>
          ) : (
            
            // --- CODING QUESTION SANDBOX LEETCODE SCREEN ---
            <div className="flex-grow flex overflow-hidden p-2.5 gap-2 bg-[#1a1a1a] w-full">
              {/* LeetCode Left Panel */}
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
                            <span className="text-[10px] text-slate-500">Secure Sandbox Engine Run</span>
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

              {/* LeetCode Right Panel */}
              <div className="flex-grow flex flex-col gap-2 overflow-hidden">
                <div className="flex-grow flex flex-col rounded-lg bg-[#282828] border border-[#333] overflow-hidden">
                  {/* Toolbar */}
                  <div className="h-10 border-b border-[#383838] bg-[#282828] px-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#333] hover:bg-[#383838] text-white transition-colors cursor-pointer">
                        Python 3
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <div className="h-3 w-px bg-[#383838]" />
                      <button className="p-1 rounded hover:bg-[#333] text-slate-400 hover:text-white transition-colors cursor-pointer" title="Auto-complete active">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button onClick={handleReset} className="p-1.5 rounded hover:bg-[#333] text-slate-400 hover:text-white transition-colors cursor-pointer" title="Reset code">
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

                  {/* Monaco editor */}
                  <div className="flex-grow min-h-[220px]">
                    <Editor
                      height="100%"
                      language="python"
                      value={code}
                      onChange={(value) => {
                        setCode(value || '');
                        const updated = questions.map(q => q.id === currentQuestionId ? { ...q, starterCode: value || '' } : q);
                        setQuestions(updated);
                        saveStateSecurely(updated, value || '');
                      }}
                      theme="vs-dark"
                      onMount={(editor) => {
                        // Override Monaco's internal paste command — blocks right-click → Paste
                        editor.addCommand(
                          // KeyCode for Ctrl+V is 2097 in Monaco keybinding notation; 
                          // but overriding the paste action by ID is more reliable
                          0, // null keybinding (we just want to override the action)
                          () => {} // no-op
                        );

                        // Directly override the editor.trigger paste action
                        // The paste action in Monaco is registered as 'editor.action.clipboardPasteAction'
                        // We replace it by adding a command override on the editor instance
                        const pasteActionId = 'editor.action.clipboardPasteAction';
                        editor.addAction({
                          id: pasteActionId,
                          label: 'Paste (Blocked)',
                          run: () => {
                            toast.error('⚠️ Integrity Violation: Paste attempt detected. Score docked.', {
                              duration: 4000,
                              style: { background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }
                            });
                            setSecurityScore(prev => Math.max(0, prev - 10));
                          }
                        });
                      }}
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
                        contextmenu: false,
                      }}
                    />
                  </div>
                </div>

                {/* Console */}
                <div className={`rounded-lg bg-[#282828] border border-[#333] flex flex-col overflow-hidden transition-all duration-300 ${
                  consoleOpen ? 'h-[250px]' : 'h-10'
                }`}>
                  <div className="h-10 border-b border-[#383838] bg-[#282828] px-4 flex items-center justify-between">
                    <button onClick={() => setConsoleOpen(!consoleOpen)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer">
                      <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${consoleOpen ? '' : 'rotate-180'}`} />
                      Console
                    </button>
                    
                    {queueLength > 0 && (
                      <div className="flex items-center gap-2 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md font-mono animate-pulse">
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        <span>Queue position: {queueLength} ({queueStatus})</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button onClick={() => { setConsoleOpen(true); setConsoleTab('testcase'); }} className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${consoleTab === 'testcase' && consoleOpen ? 'text-white' : 'text-slate-400'}`}>Testcase</button>
                      <button onClick={() => { setConsoleOpen(true); setConsoleTab('result'); }} className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${consoleTab === 'result' && consoleOpen ? 'text-white' : 'text-slate-400'}`}>Result</button>
                    </div>
                  </div>

                  {consoleOpen && (
                    <div className="flex-1 p-4 bg-[#1e1e1e] overflow-y-auto text-xs">
                      {consoleTab === 'testcase' ? (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            {testCases.map((tc) => (
                              <button key={tc.id} onClick={() => setActiveTestCaseId(tc.id)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${activeTestCaseId === tc.id ? 'bg-[#333] border-[#555] text-white' : 'bg-transparent border-[#333] text-slate-400'}`}>Case {tc.id}</button>
                            ))}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">String s</span>
                            <div className="font-mono p-3 bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg text-orange-400 font-semibold">{testCases.find(t => t.id === activeTestCaseId)?.input.replace('s = ', '')}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {isRunning ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-2.5">
                              <Hourglass className="w-5 h-5 text-orange-500 animate-spin" />
                              <span className="text-slate-400 text-xs font-mono">Sandboxed compiler environment running verification tests...</span>
                            </div>
                          ) : hasRun ? (
                            <div className="space-y-4 animate-fade-in">
                              <div className="flex items-center gap-3">
                                <span className={`text-base font-bold uppercase tracking-wider ${submissionStatus === 'Accepted' ? 'text-emerald-400' : 'text-rose-500'}`}>{submissionStatus}</span>
                                <span className="text-xs text-slate-500">Secure compiler sandbox</span>
                              </div>

                              {testCases[0]?.error ? (
                                <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-400 font-mono text-[11px] whitespace-pre-wrap flex items-start gap-3">
                                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                  <span>{testCases[0].error}</span>
                                </div>
                              ) : (
                                <>
                                  {consoleOutput && (
                                    <div className="space-y-1.5 mb-4">
                                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Stdout Logs</span>
                                      <pre className="p-3 bg-[#131313] border border-[#2d2d2d] rounded-lg font-mono text-xs text-orange-200/90 max-h-[100px] overflow-y-auto whitespace-pre-wrap leading-relaxed">{consoleOutput}</pre>
                                    </div>
                                  )}

                                  <div className="flex gap-2 border-b border-[#333] pb-2">
                                    {testCases.map((tc) => (
                                      <button key={tc.id} onClick={() => setActiveTestCaseId(tc.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold border ${activeTestCaseId === tc.id ? 'bg-[#333] border-[#555] text-white' : 'bg-transparent border-[#2d2d2d] text-slate-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${tc.status === 'passed' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
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
                                          <div className="p-2.5 rounded bg-[#282828] border border-[#383838] font-mono text-slate-300 font-semibold">{selectedCase.input}</div>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Output</span>
                                          <div className={`p-2.5 rounded border font-mono ${selectedCase.status === 'passed' ? 'bg-[#282828] border-emerald-950/60 text-emerald-400 font-semibold' : 'bg-[#282828] border-rose-950/60 text-rose-400 font-semibold'}`}>{selectedCase.actual}</div>
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Expected Output</span>
                                          <div className="p-2.5 rounded bg-[#282828] border border-[#383838] font-mono text-emerald-400 font-semibold">{selectedCase.expected}</div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-500 text-xs">Please run your code to see the testcase results.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom actions */}
                <div className="h-12 border border-[#333] rounded-lg bg-[#282828] px-4 flex items-center justify-between shrink-0">
                  <button onClick={() => setConsoleOpen(!consoleOpen)} className="px-3.5 py-1.5 rounded bg-[#333] hover:bg-[#383838] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer">Console</button>
                  <div className="flex items-center gap-2">
                    <button onClick={runCode} disabled={isRunning} className="px-4 py-1.5 rounded bg-[#333] hover:bg-[#3b3b3b] disabled:bg-slate-800 disabled:text-slate-600 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Run
                    </button>
                    <button onClick={submitAssessment} className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer">Submit</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
          <div className="glass-panel border border-[#333] p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/25 flex items-center justify-center mx-auto text-orange-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Reset Code Sandbox?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">This will discard your current progress and restore the default Python template.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#3c3c3c] text-xs font-semibold rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setCode(pythonTemplate);
                  saveStateSecurely(questions, pythonTemplate);
                  setShowResetConfirm(false);
                  toast.success('Code template restored');
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {showScoreModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
          <div className="glass-panel border border-[#333] p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl bg-[#090d1a]">
            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Evaluation Complete
              </span>
              <h2 className="text-xl font-extrabold text-white font-['Outfit'] pt-2">Exam Score Report</h2>
              <p className="text-xs text-slate-400">Your test answers have been processed and validated by the security sandbox compiler.</p>
            </div>

            {/* Scorecard grids */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                <span className="text-slate-400">Multiple Choice Score:</span>
                <span className="text-white font-bold">{examBreakdown.mcqScore} / {examBreakdown.mcqMax} pts</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                <span className="text-slate-400">Coding Sandbox Score:</span>
                <span className="text-white font-bold">{examBreakdown.codingScore} / {examBreakdown.codingMax} pts</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                <span className="text-slate-400">Integrity Proctor Audit:</span>
                <span className={`font-bold ${examBreakdown.integrityScore < 80 ? 'text-rose-400' : 'text-indigo-400'}`}>
                  {examBreakdown.integrityScore}%
                </span>
              </div>
              <div className="border-t border-[#222] my-2 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-white">Total Final Grade:</span>
                <span className="text-emerald-400">{examBreakdown.totalScore} / {examBreakdown.totalMax} pts</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/candidate-dashboard')}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center cursor-pointer"
            >
              Return to Candidate Dashboard
            </button>
          </div>
        </div>
      )}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
          <div className="glass-panel border border-rose-500/20 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl bg-[#1a0a0a]">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold text-white font-['Outfit']">🚨 PROCTOR WARNING 🚨</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                A focus loss, tab switch, or fullscreen exit has been logged. 
              </p>
              <p className="text-xs text-rose-400 font-bold leading-relaxed">
                Warning: Any further violations will result in IMMEDIATE DISQUALIFICATION from this assessment.
              </p>
            </div>
            <button 
              onClick={() => {
                setShowWarningModal(false);
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch((err) => {
                    console.error("Re-entering fullscreen failed:", err);
                  });
                }
              }}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center cursor-pointer"
            >
              I Understand, Resume Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
