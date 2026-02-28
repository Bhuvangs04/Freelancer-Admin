import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Search, Trash2, Edit, Plus, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import api from "@/lib/api";

interface ChallengeSummary {
  skillName: string;
  questionCount: number;
  difficulties: string[];
  isActive: boolean;
}

interface Question {
  _id?: string;
  question: string;
  options: { text: string; isCorrect: boolean; _id?: string }[];
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation: string;
  skillName?: string;
  category?: string;
}

export const SkillChallengesView = () => {
  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Detail View State
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Add Question State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question: "",
    difficulty: "intermediate",
    explanation: "",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/vi/skills/admin/challenges");
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
      toast({
        title: "Error",
        description: "Failed to load skill challenges.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (skillName: string) => {
    try {
      setLoadingQuestions(true);
      const { data } = await api.get(`/api/vi/skills/admin/questions/${skillName}`);
      setQuestions(data.questions || []);
      setSelectedSkill(skillName);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions.",
        variant: "destructive",
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleDeleteChallenge = async (skillName: string) => {
    if (!window.confirm(`Are you sure you want to delete all questions for ${skillName}? This cannot be undone.`)) return;

    try {
      await api.delete(`/api/vi/skills/admin/questions/skill/${skillName}`);
      toast({ title: "Success", description: `Challenge for ${skillName} deleted.` });
      setChallenges((prev) => prev.filter((c) => c.skillName !== skillName));
      if (selectedSkill === skillName) setSelectedSkill(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete challenge.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await api.delete(`/api/vi/skills/admin/questions/${id}`);
      toast({ title: "Success", description: "Question deleted successfully." });
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      
      // Update the count in the parent list
      setChallenges((prev) => 
        prev.map((c) => 
          c.skillName === selectedSkill 
            ? { ...c, questionCount: Math.max(0, c.questionCount - 1) } 
            : c
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete question.",
        variant: "destructive",
      });
    }
  };

  const handleSaveQuestion = async () => {
    const targetSkill = selectedSkill || newSkillName.toLowerCase().trim();
    if (!targetSkill) {
      toast({ title: "Error", description: "Skill name is required.", variant: "destructive" });
      return;
    }
    if (!newQuestion.question?.trim()) {
      toast({ title: "Error", description: "Question text is required.", variant: "destructive" });
      return;
    }
    
    // Validate options
    const validOptions = newQuestion.options?.filter(o => o.text.trim() !== "");
    if (!validOptions || validOptions.length < 2) {
      toast({ title: "Error", description: "At least two options are required.", variant: "destructive" });
      return;
    }
    if (!validOptions.some(o => o.isCorrect)) {
      toast({ title: "Error", description: "At least one option must be correct.", variant: "destructive" });
      return;
    }

    try {
      setSavingQuestion(true);
      const questionPayload = {
        skillName: targetSkill,
        question: newQuestion.question,
        options: validOptions,
        difficulty: newQuestion.difficulty,
        explanation: newQuestion.explanation,
        category: "programming"
      };

      await api.post("/api/vi/skills/admin/questions", { questions: [questionPayload] });
      toast({ title: "Success", description: "Question added successfully." });
      
      setIsAddOpen(false);
      
      // Refresh context
      if (selectedSkill) {
        fetchQuestions(selectedSkill);
      } else {
        fetchChallenges();
        setNewSkillName("");
      }

      // Reset form
      setNewQuestion({
        question: "",
        difficulty: "intermediate",
        explanation: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ]
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save question.",
        variant: "destructive",
      });
    } finally {
      setSavingQuestion(false);
    }
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...(newQuestion.options || [])];
    if (field === "isCorrect") {
      // Single correct answer logic for simplicity, or allow multiple
      newOptions.forEach(o => o.isCorrect = false);
      newOptions[index].isCorrect = true;
    } else {
      newOptions[index] = { ...newOptions[index], [field]: value };
    }
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  // --- Render Detail View ---
  if (selectedSkill) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedSkill(null)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Challenges
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold capitalize tracking-tight flex items-center gap-2">
              {selectedSkill} Challenge
              <Badge variant="outline">{questions.length} Questions</Badge>
            </h2>
            <p className="text-muted-foreground text-sm">Manage questions for this skill challenge.</p>
          </div>
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Question
          </Button>
        </div>

        {loadingQuestions ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q, idx) => (
              <Card key={q._id}>
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-start gap-2">
                        <span className="text-muted-foreground">Q{idx + 1}.</span> 
                        {q.question}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={
                          q.difficulty === 'advanced' ? 'border-rose-200 text-rose-700 bg-rose-50' :
                          q.difficulty === 'beginner' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                          'border-amber-200 text-amber-700 bg-amber-50'
                        }>
                          {q.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteQuestion(q._id || '')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4 border-t bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, i) => (
                      <div key={opt._id || i} className={`p-2 rounded-md border text-sm flex items-start gap-2 ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
                        {opt.isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" /> : <XCircle className="w-4 h-4 text-slate-300 mt-0.5" />}
                        {opt.text}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-100 flex gap-2 items-start">
                      <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block mb-0.5">Explanation:</span>
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {questions.length === 0 && (
              <div className="text-center p-12 border rounded-xl bg-slate-50 text-slate-500">
                No questions found for this challenge.
              </div>
            )}
          </div>
        )}

        {/* Add Question Dialog (used in detail view) */}
        <Dialog open={isAddOpen && !!selectedSkill} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Question to {selectedSkill}</DialogTitle>
              <DialogDescription>Create a new multiple choice question for this skill challenge.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="question_d">Question</Label>
                <Textarea id="question_d" value={newQuestion.question} onChange={e => setNewQuestion({...newQuestion, question: e.target.value})} placeholder="What is the output of..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="difficulty_d">Difficulty</Label>
                <Select value={newQuestion.difficulty} onValueChange={(v: "beginner"|"intermediate"|"advanced") => setNewQuestion({...newQuestion, difficulty: v})}>
                  <SelectTrigger id="difficulty_d"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Options (Check the correct answer)</Label>
                {newQuestion.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className={opt.isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-600" : ""}
                      onClick={() => updateOption(i, "isCorrect", true)}
                    >
                      {opt.isCorrect ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-slate-300" />}
                    </Button>
                    <Input value={opt.text} onChange={e => updateOption(i, "text", e.target.value)} placeholder={`Option ${i+1}`} />
                  </div>
                ))}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="explanation_d">Explanation (Optional)</Label>
                <Textarea id="explanation_d" value={newQuestion.explanation} onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})} placeholder="Why is this the correct answer?" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveQuestion} disabled={savingQuestion}>
                {savingQuestion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- Render Master List ---
  const filteredChallenges = challenges.filter((c) =>
    c.skillName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Skill Challenges</h2>
          <p className="text-muted-foreground text-sm">Manage automated skill assessment challenges and question banks.</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Challenge
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Challenge Database</CardTitle>
              <CardDescription>{challenges.length} active skill challenges.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skill..."
                className="pl-8 bg-gray-50/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Skill Name</TableHead>
                  <TableHead>Questions Count</TableHead>
                  <TableHead>Difficulties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-600" />
                    </TableCell>
                  </TableRow>
                ) : filteredChallenges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No skill challenges found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChallenges.map((c) => (
                    <TableRow key={c.skillName}>
                      <TableCell className="font-medium capitalize">{c.skillName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={c.questionCount < 5 ? "bg-amber-100 text-amber-800 hover:bg-amber-100 relative" : ""}>
                          {c.questionCount} {c.questionCount === 1 ? 'Question' : 'Questions'}
                          {c.questionCount < 5 && (
                            <span title="Needs at least 5 questions to be available to freelancers" className="cursor-help ml-1">⚠️</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {c.difficulties.map(d => (
                            <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.isActive ? (
                          <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-slate-400" /> Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchQuestions(c.skillName)}
                          >
                            Manage Questions
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => handleDeleteChallenge(c.skillName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Challenge Dialog (used in master list) */}
      <Dialog open={isAddOpen && !selectedSkill} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Skill Challenge</DialogTitle>
            <DialogDescription>Start a new challenge by adding its first question.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="skillName_m">Skill Name</Label>
              <Input id="skillName_m" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="e.g. React" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="question_m">Question</Label>
              <Textarea id="question_m" value={newQuestion.question} onChange={e => setNewQuestion({...newQuestion, question: e.target.value})} placeholder="What is the output of..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="difficulty_m">Difficulty</Label>
              <Select value={newQuestion.difficulty} onValueChange={(v: "beginner"|"intermediate"|"advanced") => setNewQuestion({...newQuestion, difficulty: v})}>
                <SelectTrigger id="difficulty_m"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Options (Check the correct answer)</Label>
              {newQuestion.options?.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={opt.isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-600" : ""}
                    onClick={() => updateOption(i, "isCorrect", true)}
                  >
                    {opt.isCorrect ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-slate-300" />}
                  </Button>
                  <Input value={opt.text} onChange={e => updateOption(i, "text", e.target.value)} placeholder={`Option ${i+1}`} />
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="explanation_m">Explanation (Optional)</Label>
              <Textarea id="explanation_m" value={newQuestion.explanation} onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})} placeholder="Why is this the correct answer?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} disabled={savingQuestion}>
              {savingQuestion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
