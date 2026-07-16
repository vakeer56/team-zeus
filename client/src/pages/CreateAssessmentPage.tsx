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
import { apiUrl } from '../config/api';

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
  description?: string;
  example1Input?: string;
  example1Output?: string;
  example1Explanation?: string;
  example2Input?: string;
  example2Output?: string;
  example2Explanation?: string;
  example3Input?: string;
  example3Output?: string;
  example3Explanation?: string;
  constraints?: string;
}

export const CreateAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      ],
      description: '',
      example1Input: '',
      example1Output: '',
      example1Explanation: '',
      example2Input: '',
      example2Output: '',
      example2Explanation: '',
      example3Input: '',
      example3Output: '',
      example3Explanation: '',
      constraints: ''
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
      starterCode: '',
      testCases: type === 'coding' ? [{ input: '', expectedOutput: '' }] : [],
      description: '',
      example1Input: '',
      example1Output: '',
      example1Explanation: '',
      example2Input: '',
      example2Output: '',
      example2Explanation: '',
      example3Input: '',
      example3Output: '',
      example3Explanation: '',
      constraints: ''
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

  const updateCodingField = (qId: string, field: keyof FormQuestion, val: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: val } : q));
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

    const activeQuestions = questions.filter(q => q.text.trim() !== '');

    if (activeQuestions.length === 0) {
      toast.error("Assessment must contain at least 1 question with text statement completed.", {
        duration: 5000,
        style: { background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch(apiUrl('/assessments'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          duration: parseInt(duration) || 60,
          difficulty: "medium",
          status: "published",
          questions: activeQuestions.map(q => {
            const isMcq = q.type === 'mcq';
            
            // Format challenge description + examples + constraints in coding payload
            const questionValue = isMcq 
              ? q.text 
              : JSON.stringify({
                  title: q.text,
                  description: q.description || '',
                  examples: [
                    { input: q.example1Input || '', output: q.example1Output || '', explanation: q.example1Explanation || '' },
                    { input: q.example2Input || '', output: q.example2Output || '', explanation: q.example2Explanation || '' },
                    { input: q.example3Input || '', output: q.example3Output || '', explanation: q.example3Explanation || '' }
                  ].filter(ex => ex.input.trim() !== '' || ex.output.trim() !== ''),
                  constraints: q.constraints ? q.constraints.split('\n').map(c => c.trim()).filter(Boolean) : []
                });

            return {
              question: questionValue,
              type: isMcq ? 'MCQ' : 'CODE',
              marks: q.marks,
              options: isMcq ? q.options : undefined,
              correctOptionIndex: isMcq ? q.correctOptionIndex : undefined,
              starterCode: !isMcq ? q.starterCode : undefined,
              language: !isMcq ? 'python' : undefined,
              sampleTestCases: !isMcq ? q.testCases.filter(tc => tc.input.trim() !== '' && tc.expectedOutput.trim() !== '').map(tc => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput
              })) : undefined,
              hiddenTestCases: !isMcq ? q.testCases.filter(tc => tc.input.trim() !== '' && tc.expectedOutput.trim() !== '').map(tc => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput
              })) : undefined
            };
          })
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
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative bg-grid-pattern pb-20 p-6 sm:p-12">
      {/* Background neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Header desk inside container to align perfectly */}
      <div className="max-w-4xl w-full mx-auto space-y-8 z-10 relative">
        
        {/* Navigation row */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <button 
            onClick={() => navigate('/recruiter-dashboard')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold font-['Outfit'] tracking-wide"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-900 text-xs font-semibold text-indigo-400 font-['Outfit']">
            <FileText className="w-4 h-4" />
            <span>Assessment Composer</span>
          </div>
        </div>

        {/* Title information */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black font-['Outfit'] tracking-tight text-white">Create Assessment Suite</h1>
          <p className="text-slate-400 text-sm leading-relaxed">Compose secure evaluation suites containing both multiple-choice keys and sandbox coding challenges.</p>
        </div>

        <form onSubmit={handleCreateAssessment} className="space-y-6">
          
          {/* Section 1: Basic Setup */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 bg-slate-950/20">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-900">
              <FileCode className="w-4.5 h-4.5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Assessment Configuration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assessment Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Python Security & Algorithms Test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-colors font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration (Minutes)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-colors font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description & Instructions</label>
              <textarea 
                placeholder="Specify the exam protocols, requirements, guidelines for candidates..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none resize-none transition-colors font-medium"
              />
            </div>
          </div>

          {/* Section 2: Questions */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-200 font-['Outfit'] uppercase tracking-wide">Test Cases & Questions List</h3>
                <p className="text-xs text-slate-500 font-medium">At least 1 MCQ or 1 Coding challenge is mandatory to deploy.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => addQuestion('mcq')}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-['Outfit'] tracking-wide"
                >
                  <Plus className="w-4 h-4" />
                  Add MCQ
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('coding')}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-purple-400 hover:text-purple-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-['Outfit'] tracking-wide"
                >
                  <Plus className="w-4 h-4" />
                  Add Coding
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div key={q.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 relative bg-slate-950/20">
                  
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="absolute top-5 right-5 text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Remove Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border font-mono ${
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {q.type === 'mcq' ? 'Question Statement' : 'Challenge Name / Title'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={q.type === 'mcq' ? "e.g. What is the value of print(2**3) in Python?" : "e.g. Longest Palindromic Substring"}
                        value={q.text}
                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-750 focus:outline-none transition-colors font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marks / Weightage</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="10"
                        value={q.marks}
                        onChange={(e) => updateQuestionMarks(q.id, parseInt(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-750 focus:outline-none transition-colors font-medium"
                      />
                    </div>
                  </div>

                  {/* MCQ Options */}
                  {q.type === 'mcq' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Choices (Select correct radio option)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-3 bg-slate-950 border border-slate-900 focus-within:border-indigo-500/50 transition-all px-3 py-2.5 rounded-xl">
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
                              className="w-full bg-transparent border-none p-0 text-sm text-white placeholder-slate-750 focus:outline-none font-medium"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coding Block details */}
                  {q.type === 'coding' && (
                    <div className="space-y-5">
                      {/* Challenge Description */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Challenge Description & Explanations</label>
                        <textarea
                          placeholder="Given a string s, find the length of the longest substring..."
                          value={q.description || ''}
                          onChange={(e) => updateCodingField(q.id, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-750 focus:outline-none resize-none transition-colors font-medium"
                        />
                      </div>

                      {/* Examples Input Rows */}
                      <div className="space-y-4 border-t border-slate-900 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Examples Configuration</span>
                        
                        {/* Example 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-900">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 1 Input (e.g. s = "abc")</label>
                            <input 
                              type="text" 
                              placeholder='s = "abcabcbb"'
                              value={q.example1Input || ''}
                              onChange={(e) => updateCodingField(q.id, 'example1Input', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 1 Output (e.g. 3)</label>
                            <input 
                              type="text" 
                              placeholder='3'
                              value={q.example1Output || ''}
                              onChange={(e) => updateCodingField(q.id, 'example1Output', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 1 Explanation</label>
                            <input 
                              type="text" 
                              placeholder='The answer is "abc", with length 3'
                              value={q.example1Explanation || ''}
                              onChange={(e) => updateCodingField(q.id, 'example1Explanation', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Example 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-900">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 2 Input</label>
                            <input 
                              type="text" 
                              placeholder='s = "bbbbb"'
                              value={q.example2Input || ''}
                              onChange={(e) => updateCodingField(q.id, 'example2Input', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 2 Output</label>
                            <input 
                              type="text" 
                              placeholder='1'
                              value={q.example2Output || ''}
                              onChange={(e) => updateCodingField(q.id, 'example2Output', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 2 Explanation</label>
                            <input 
                              type="text" 
                              placeholder='The answer is "b", with length 1'
                              value={q.example2Explanation || ''}
                              onChange={(e) => updateCodingField(q.id, 'example2Explanation', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Example 3 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-900">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 3 Input</label>
                            <input 
                              type="text" 
                              placeholder='s = "pwwkew"'
                              value={q.example3Input || ''}
                              onChange={(e) => updateCodingField(q.id, 'example3Input', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 3 Output</label>
                            <input 
                              type="text" 
                              placeholder='3'
                              value={q.example3Output || ''}
                              onChange={(e) => updateCodingField(q.id, 'example3Output', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Example 3 Explanation</label>
                            <input 
                              type="text" 
                              placeholder='The answer must be a substring...'
                              value={q.example3Explanation || ''}
                              onChange={(e) => updateCodingField(q.id, 'example3Explanation', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-white placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Constraints */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Constraints (One per line)</label>
                        <textarea
                          placeholder={`0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.`}
                          value={q.constraints || ''}
                          onChange={(e) => updateCodingField(q.id, 'constraints', e.target.value)}
                          rows={2}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-mono text-sm text-slate-300 placeholder-slate-750 focus:outline-none resize-none transition-colors"
                        />
                      </div>

                      {/* Starter Code */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starter Snippet Code Stub (Python)</label>
                        <textarea
                          placeholder={`def lengthOfLongestSubstring(s: str) -> int:\n    # Enter implementation stubs\n    pass`}
                          value={q.starterCode}
                          onChange={(e) => updateCodingStarter(q.id, e.target.value)}
                          rows={4}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-mono text-sm text-emerald-400 placeholder-slate-750 focus:outline-none resize-none transition-colors"
                        />
                      </div>

                      {/* Test cases list */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Test Cases</span>
                          <button
                            type="button"
                            onClick={() => addTestCase(q.id)}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1 font-mono"
                          >
                            + Add Scenario
                          </button>
                        </div>

                        <div className="space-y-3">
                          {q.testCases.map((tc, tcIdx) => (
                            <div key={tcIdx} className="grid grid-cols-1 sm:grid-cols-9 gap-4 items-center bg-slate-950 p-4 rounded-xl border border-slate-900">
                              <div className="sm:col-span-4 space-y-1">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Input (e.g. s = "abc")</span>
                                <input
                                  type="text"
                                  required
                                  placeholder='s = "abcabcbb"'
                                  value={tc.input}
                                  onChange={(e) => updateTestCase(q.id, tcIdx, 'input', e.target.value)}
                                  className="w-full bg-transparent border-none p-0 text-sm text-white placeholder-slate-750 focus:outline-none font-medium"
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
                                  className="w-full bg-transparent border-none p-0 text-sm text-white placeholder-slate-750 focus:outline-none font-medium"
                                />
                              </div>
                              <div className="sm:col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeTestCase(q.id, tcIdx)}
                                  className="text-slate-600 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Delete Case"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-['Outfit'] tracking-wide"
          >
            {isSubmitting ? 'Publishing Suite...' : 'Deploy Assessment Suite & Broadcast'}
          </button>

        </form>
      </div>
    </div>
  );
};
