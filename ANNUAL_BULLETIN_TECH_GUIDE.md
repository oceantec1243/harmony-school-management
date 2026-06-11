# Bulletin Annuel - Technical Implementation Guide

## 🔧 Architecture Overview

### Component Structure
The Annual Bulletin is a single-page component with sophisticated data processing:

```
app/reports/annual-bulletin/page.tsx (826 lines)
├── State Management (hooks)
├── Data Fetching (useEffect + Supabase)
├── Calculations (averaging, rankings, statistics)
├── Visualizations (Recharts charts)
└── UI Rendering (shadcn/ui components)
```

### Data Flow
```
1. Browser Language Detection
   └─> Set initial language (FR/EN)

2. Academic Year & Section Selection
   └─> Trigger data fetch

3. Fetch from Supabase
   ├─> academic_periods (all sequences)
   ├─> grades (with relationships)
   ├─> level_subjects (for coefficients)
   ├─> student_unranked_periods (for filtering)
   └─> students (for details)

4. Data Processing
   ├─> Group grades by student & subject
   ├─> Calculate weighted averages
   ├─> Determine sequence rankings
   └─> Aggregate school statistics

5. State Updates
   ├─> sequenceData (per-sequence summaries)
   ├─> annualStudents (ranked list)
   └─> schoolStats (KPIs)

6. UI Rendering
   ├─> KPI Cards
   ├─> Tab Content
   └─> Charts (Recharts)
```

## 📚 Key Functions & Variables

### State Variables
```typescript
// UI State
const [loading, setLoading] = useState(true)
const [language, setLanguage] = useState<"fr" | "en">("fr")
const [academicYear, setAcademicYear] = useState<string>("")
const [selectedSection, setSelectedSection] = useState<string>("all")
const [activeTab, setActiveTab] = useState("overview")

// Data State
const [sequenceData, setSequenceData] = useState<SequenceData[]>([])
const [annualStudents, setAnnualStudents] = useState<AnnualStudentSummary[]>([])
const [schoolStats, setSchoolStats] = useState({...})
```

### Interfaces
```typescript
interface SequenceData {
  sequence: AcademicPeriod
  students: Map<string, { average: number; grades: Record<string, number> }>
  overall: { average: number; passRate: number; excellenceRate: number }
}

interface AnnualStudentSummary {
  student: Student
  sequenceAverages: number[]         // 6 values for 6 sequences
  annualAverage: number              // Average of all sequences
  annualMention: string              // "Excellent", "Très Bien", etc
  bestSequence: number               // Highest score
  worstSequence: number              // Lowest score
  trend: "improving" | "stable" | "declining"
}
```

## 🔢 Calculation Algorithms

### 1. Weighted Average Calculation
```typescript
// For each student in each sequence:
const subjectGrades = new Map<string, { scores: number[]; coef: number }>()

// Group grades by subject
grades.forEach(grade => {
  const subject = grade.subject.name
  let coef = levelSubjectsMap.get(`${levelId}_${subjectId}`) || grade.coefficient
  // ...
})

// Calculate weighted sum
let totalWeighted = 0
let totalCoef = 0

subjectGrades.forEach((data, subject) => {
  const avg = data.scores.reduce((a, b) => a + b) / data.scores.length
  totalWeighted += avg * data.coef
  totalCoef += data.coef
})

const sequenceAverage = totalCoef > 0 ? totalWeighted / totalCoef : 0
```

### 2. Annual Average Calculation
```typescript
// Simple average of all 6 sequence averages
const annualAverage = sequenceAverages.length > 0
  ? sequenceAverages.reduce((a, b) => a + b) / sequenceAverages.length
  : 0
```

### 3. Trend Detection
```typescript
const trend = sequenceAverages.length >= 2
  ? sequenceAverages[sequenceAverages.length - 1] > sequenceAverages[0]
    ? "improving"
    : sequenceAverages[sequenceAverages.length - 1] < sequenceAverages[0]
      ? "declining"
      : "stable"
  : "stable"
```

### 4. Mention Assignment
```typescript
const getMentionLabel = (avg: number, lang: "fr" | "en") => {
  if (avg >= 16) return lang === "fr" ? "Excellent" : "Excellent"
  if (avg >= 14) return lang === "fr" ? "Très Bien" : "Very Good"
  if (avg >= 12) return lang === "fr" ? "Bien" : "Good"
  if (avg >= 10) return lang === "fr" ? "Assez Bien" : "Fairly Good"
  return lang === "fr" ? "Insuffisant" : "Insufficient"
}
```

## 🎯 Key Technical Decisions

### 1. **Coefficient Handling**
The system respects three sources of coefficients (in priority order):
1. `level_subjects.coefficient` (most accurate - per level)
2. `grade.level_subject.coefficient` (grade-specific override)
3. `grade.coefficient` (fallback)

This ensures accurate weighting even with mixed data sources.

### 2. **Section Filtering**
Sections are filtered at the student level:
- Fetch all grades
- During processing, check `student.class.section.id`
- Skip students not in selected section
- Works for both UI display and statistics

### 3. **Student Ranking**
Ranking respects ties:
- Sort students by descending average
- If two students have same average, assign same rank
- Next student gets correct rank (not skipped)

### 4. **Language Switching**
Uses React state instead of URL params:
- Automatic browser language detection
- Manual override via FR/EN buttons
- All UI strings in `translations` object
- Charts update dynamically

## 📊 Performance Optimizations

### 1. **Memoization**
```typescript
const sequenceChartData = useMemo(() => {
  return sequenceData.map((seq, idx) => ({...}))
}, [sequenceData, language])
```
Prevents unnecessary recalculations when parent re-renders.

### 2. **Map Data Structures**
```typescript
const levelSubjectsMap = new Map<string, number>()
const studentGradesMap = new Map<string, typeof grades>()
```
O(1) lookups instead of O(n) array searches.

### 3. **Set for Membership Testing**
```typescript
const allStudentIds = new Set<string>()
allStudentIds.forEach((id) => {...})
```
Efficient duplicate detection.

### 4. **Lazy Chart Rendering**
- Charts only render when their tab is active
- `ResponsiveContainer` handles resize detection
- Scroll areas for large datasets

## 🧪 Testing Scenarios

### Test Case 1: Multi-Section School
```
Expected: Statistics split between sections
Action: 
  1. Load page with "Toutes les sections"
  2. Verify total students = sum of both sections
  3. Change to "Francophone" only
  4. Verify totals reduced accordingly
```

### Test Case 2: Sequence Progression
```
Expected: Trends identified correctly
Data: Student with averages [8, 9, 10, 11, 12, 13]
Expected Trend: "improving"
```

### Test Case 3: Tied Rankings
```
Expected: Tied students show same rank
Data: Two students with average 15.0
Expected Rank: Both get rank 2, next is rank 3
```

### Test Case 4: Language Toggle
```
Expected: All UI updates immediately
Action: Click EN button
Verify: 
  - "BULLETIN ANNUEL" → "ANNUAL REPORT"
  - "Séquence" → "Sequence"
  - Charts update labels
```

### Test Case 5: Empty Selection
```
Expected: Graceful handling
Action: Select year with no grades
Verify: "Aucune donnée disponible" message shown
```

## 🚨 Error Handling

The component handles several error scenarios:

```typescript
try {
  // Data fetching and processing
} catch (error) {
  console.error("Error fetching annual data:", error)
  setLoading(false)
  // UI shows "No data available" instead of crashing
}
```

### Potential Errors
1. **No academic periods**: Empty year selection
2. **No grades**: Empty class or sequence
3. **Missing relationships**: Broken subject_group references
4. **Database connection**: Supabase timeout

All are handled gracefully with user-friendly messages.

## 🔐 Security Considerations

### Row-Level Security (RLS)
The application assumes RLS is NOT enforced on most tables (see Supabase schema). 
If RLS is added:
- Ensure `authenticated` role can read all needed tables
- May need to filter by user's school/organization in policies

### Data Privacy
- Displays student names and rankings (standard educational practice)
- No sensitive data like parents' contact info
- Respects student unranked periods (educational equity)

## 📱 Responsive Design

### Breakpoints
- **Mobile** (< 768px): Single column, collapsed filters
- **Tablet** (768px - 1024px): Two columns
- **Desktop** (> 1024px): Full layout

### Tailwind Classes Used
```
grid-cols-1        # Mobile
md:grid-cols-2     # Tablet
lg:grid-cols-3     # Desktop
lg:grid-cols-4     # Large screens
md:flex-row         # Flex layouts
md:w-48             # Responsive widths
```

## 🎨 Styling System

### Color Tokens (via Tailwind)
```
bg-primary          → #1E40AF
bg-success          → #16A34A
bg-warning          → #EAB308
bg-danger           → #DC2626
bg-purple-100       → Light purple for mention badges
```

### Typography
- **Headers**: font-bold, text-2xl
- **Data**: font-bold, text-3xl
- **Labels**: text-sm, text-muted-foreground

## 📈 Future Scalability

### Optimization for Larger Schools
- Add pagination to student table (limit 50 per page)
- Implement React Query for caching
- Use server-side filtering for sections
- Add virtualization for large lists

### Extended Features
- **Time-Series Analysis**: Line chart of averages over time
- **Comparisons**: Select multiple students to compare trends
- **Exports**: PDF/CSV with institutional header
- **Comments**: Admin notes per student/class
- **Alerts**: Highlight students below threshold

---

**Document Version**: 1.0  
**Last Updated**: June 11, 2026  
**Author**: v0 AI Assistant  
**Status**: Production Ready
