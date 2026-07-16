import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Clock, 
  Plus, 
  Trash2, 
  FileText,
  FileCode
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FormQuestion {
  id: string;
  type: 'mcq' | 'coding';
  text: string;
  marks: number;
  // MCQ fields
  options: string[];
  correctOptionIndex: number;
  // Coding fields
  starterCode: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
}

export const CreateAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with empty array (or one empty of each but using PLACEHOLDERS instead of default values)
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: '1',
      type: 'mcq',
      text: '',
      marks: 5,
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      starterCode: '',
      testCases: []
    },
    {
      id: '2',
      type: 'coding',
      text: '',
      marks: 15,
      options: [],
      correctOptionIndex: 0,
      starterCode: '',
      testCases: [
        { input: '', expectedOutput: '' }
      ]
    }
  ]);

  const addQuestion = (type: 'mcq' | 'coding') => {
    const newQ: FormQuestion = {
      id: Math.random().toString(),
      type,
      text: '',
      marks: type === 'mcq' ? 5 : 10,
      options: type === 'mcq' ? ['', '', '', ''] : [],
      correctOptionIndex: 0,
      starterCode: type === 'coding' ? '' : '',
      testCases: type === 'coding' ? [{ input: '', expectedOutput: '' }] : []
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateQuestionMarks = (id: string, marks: number) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, marks } : q));
  };

  // MCQ handlers
  const updateMCQOption = (qId: string, optIdx: number, val: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const opts = [...q.options];
        opts[optIdx] = val;
        return { ...q, options: opts };
      }
      return q;
    }));
  };

  const updateMCQCorrect = (qId: string, idx: number) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, correctOptionIndex: idx } : q));
  };

  // Coding handlers
  const updateCodingStarter = (qId: string, code: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, starterCode: code } : q));
  };

  const addTestCase = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, testCases: [...q.testCases, { input: '', expectedOutput: '' }] };
      }
      return q;
    }));
  };

  const updateTestCase = (qId: string, tcIdx: number, field: 'input' | 'expectedOutput', val: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const cases = [...q.testCases];
        cases[tcIdx] = { ...cases[tcIdx], [field]: val };
        return { ...q, testCases: cases };
      }
      return q;
    }));
  };

  const removeTestCase = (qId: string, tcIdx: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, testCases: q.testCases.filter((_, idx) => idx !== tcIdx) };
      }
      return q;
    }));
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an assessment title");
      return;
    }

    // Validation checks
    const hasMCQ = questions.some(q => q.type === 'mcq' && q.text.trim() !== '');
    const hasCoding = questions.some(q => q.type === 'coding' && q.text.trim() !== '');

    if (!hasMCQ || !hasCoding) {
      toast.error("Assessment must contain at least 1 filled MCQ and 1 filled Coding question.", {
        duration: 5000,
        style: { background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("https://team-zeus.onrender.com/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          durationMinutes: parseInt(duration) || 60,
          questions: questions.map(q => ({
            type: q.type,
            text: q.text,
            marks: q.marks,
            options: q.type === 'mcq' ? q.options : undefined,
            correctOptionIndex: q.type === 'mcq' ? q.correctOptionIndex : undefined,
            starterCode: q.type === 'coding' ? q.starterCode : undefined,
            testCases: q.type === 'coding' ? q.testCases.map(tc => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: false
            })) : undefined
          }))
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Assessment "${title}" published successfully!`);
        navigate('/recruiter-dashboard');
      } else {
        throw new Error(data.message || "Failed to publish assessment");
      }
    } catch (err: any) {
      toast.error(err.message || "Gateway connection timeout");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden bg-grid-pattern pb-20">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Header Desk */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/recruiter-dashboard')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-900 cursor-pointer font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-blue-400">
          <FileText className="w-4 h-4 animate-pulse" />
          <span>Assessment Composer</span>
        </div>
      </header>

      {/* Workspace */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10 relative z-10">
        
        {/* Title details */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold font-['Outfit'] tracking-tight">Create Assessment Suite</h1>
          <p className="text-slate-400 text-sm">Compose secure evaluation suites containing both multiple-choice keys and sandbox coding challenges.</p>
        </div>

        <form onSubmit={handleCreateAssessment} className="space-y-8">
          
          {/* Section 1: Basic Setup */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-900">
              <FileCode className="w-4.5 h-4.5 text-indigo-400" />
              <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">Assessment Configuration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Python Security & Algorithms Test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration (Minutes)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description & Instructions</label>
              <textarea 
                placeholder="Specify the exam protocols, requirements, guidelines for candidates..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Questions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-left">
                <h3 className="text-lg font-bold text-white font-['Outfit']">Test Cases & Questions List</h3>
                <p className="text-xs text-slate-400">At least 1 MCQ and 1 Coding challenge is mandatory to deploy.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => addQuestion('mcq')}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add MCQ
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('coding')}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-purple-400 hover:text-purple-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Coding
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 relative transition-all duration-200">
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="absolute top-6 right-6 text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Remove Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                      q.type === 'mcq' 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      Question {idx + 1}: {q.type === 'mcq' ? 'Multiple Choice' : 'Coding Assignment'}
                    </span>
                  </div>

                  {/* Question details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {q.type === 'mcq' ? 'Question Statement' : 'Challenge Name / Title'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={q.type === 'mcq' ? "e.g. What is the value of print(2**3) in Python?" : "e.g. Longest Palindromic Substring"}
                        value={q.text}
                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marks / Weightage</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="10"
                        value={q.text === '' ? '' : q.marks}
                        onChange={(e) => updateQuestionMarks(q.id, parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* MCQ Options */}
                  {q.type === 'mcq' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Answer Keys & Choices (Select correct option)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-900 focus-within:border-indigo-500/50 transition-colors">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctOptionIndex === optIdx}
                              onChange={() => updateMCQCorrect(q.id, optIdx)}
                              className="accent-indigo-500 cursor-pointer h-4 w-4 shrink-0"
                            />
                            <input
                              type="text"
                              required
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) => updateMCQOption(q.id, optIdx, e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coding Block details */}
                  {q.type === 'coding' && (
                    <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starter Snippet Code Stub (Python)</label>
                        <textarea
                          placeholder={`def lengthOfLongestSubstring(s: str) -> int:\n    # Enter implementation stubs\n    pass`}
                          value={q.starterCode}
                          onChange={(e) => updateCodingStarter(q.id, e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl font-mono text-xs text-emerald-400 placeholder-slate-700 focus:outline-none resize-none transition-colors"
                        />
                      </div>

                      {/* Test cases list */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Scenarios (Test Cases)</span>
                          <button
                            type="button"
                            onClick={() => addTestCase(q.id)}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Test Scenario
                          </button>
                        </div>

                        <div className="space-y-3">
                          {q.testCases.map((tc, tcIdx) => (
                            <div key={tcIdx} className="grid grid-cols-1 sm:grid-cols-9 gap-4 items-center bg-slate-950/80 p-4 rounded-xl border border-slate-900">
                              <div className="sm:col-span-4 space-y-1">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Input (e.g. s = "abc")</span>
                                <input
                                  type="text"
                                  required
                                  placeholder='s = "abcabcbb"'
                                  value={tc.input}
                                  onChange={(e) => updateTestCase(q.id, tcIdx, 'input', e.target.value)}
                                  className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-4 space-y-1">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Expected Output (e.g. 3)</span>
                                <input
                                  type="text"
                                  required
                                  placeholder="3"
                                  value={tc.expectedOutput}
                                  onChange={(e) => updateTestCase(q.id, tcIdx, 'expectedOutput', e.target.value)}
                                  className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeTestCase(q.id, tcIdx)}
                                  className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Delete Case"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-2xl text-xs font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? 'Publishing Suite...' : 'Deploy Assessment Suite & Broadcast'}
          </button>

        </form>
      </main>
    </div>
  );
};
