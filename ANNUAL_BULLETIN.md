# Bulletin Annuel (Annual Report) - Documentation

## 📋 Overview

The Annual Bulletin feature is a comprehensive analytics dashboard that provides a complete summary of the academic year across all 6 sequences (periods). It displays real data from the Supabase database with sophisticated statistical analysis, visualizations, and bilingual support (French/English).

**Routes:**
- **French**: `/reports/annual-bulletin`
- **English**: Available through language toggle on the page

## 🎯 Key Features

### 1. **Dynamic Filters**
- **Academic Year Selection**: Choose any academic year in the database
- **Section Filter**: Filter by Francophone, Anglophone, or All Sections
- Real-time recalculation of all statistics and charts

### 2. **KPI Dashboard** (4 Key Metrics)
- **Total Students**: Count of students in selection
- **Annual Average**: Weighted average of all students across all sequences
- **Pass Rate**: Percentage of students with annual average ≥ 10/20
- **Excellence Rate**: Percentage of students with annual average ≥ 16/20

### 3. **Four Main Tabs**

#### Tab 1: Overview (Vue d'ensemble)
- **Sequence Performance Chart**: Bar chart showing average score and pass rate for each sequence
- **Top 10 Students Trend**: Line chart tracking the top 10 students' progression through sequences
- Dynamic visualizations that update based on filters

#### Tab 2: Sequences (Séquences)
- Detailed breakdown of each of the 6 sequences
- For each sequence:
  - Annual average score
  - Pass rate (%)
  - Excellence rate (%)
- Color-coded indicators for easy identification

#### Tab 3: Students (Élèves)
- Complete ranking table of all students
- Shows per-sequence averages
- Annual average (bold, right-aligned)
- Color-coded mention badges:
  - 🟣 Excellent (≥16): Purple
  - 🔵 Très Bien (14-15.99): Blue
  - 🟢 Bien (12-13.99): Green
  - 🟡 Assez Bien (10-11.99): Yellow
  - 🔴 Insuffisant (<10): Red

#### Tab 4: Analysis (Analyse)
- **Mention Distribution**: Visual breakdown of students across all mention levels
- **Pass Rate Card**: Shows pass rate (≥10/20) with progress bar
- **Excellence Rate Card**: Shows excellence rate with visual indicator
- **At-Risk Students Card**: Shows count of students with average < 8/20
- **Sequence Comparison Chart**: Compares average scores and pass rates across all sequences

## 📊 Data Calculation

### Averaging Algorithm
1. **Per-Sequence Average**: For each student in each sequence:
   - Group grades by subject
   - Calculate subject average
   - Weight by `level_subjects.coefficient`
   - Sum weighted grades / sum coefficients

2. **Annual Average**: Average of all 6 sequence averages (simple mean)

3. **Mentions** (Socle des notes / 20):
   - **Excellent**: ≥16/20
   - **Très Bien**: 14-15.99/20
   - **Bien**: 12-13.99/20
   - **Assez Bien**: 10-11.99/20
   - **Insuffisant**: <10/20

### Status Indicators
- **Pass Status**: Annual average ≥ 10/20 = "Passed"
- **At Risk**: Annual average < 8/20
- **Honor Roll**: Annual average 14-15.99
- **Excellence**: Annual average ≥ 16/20

## 🌐 Internationalization

The page fully supports both languages with automatic detection:

**French (Français)**
- "BULLETIN ANNUEL"
- All labels, charts, and status messages in French
- Set by `language = "fr"`

**English**
- "ANNUAL REPORT"
- All labels, charts, and status messages in English
- Set by `language = "en"`

Language can be toggled via buttons in the header (FR/EN buttons).

## 🗄️ Database Integration

### Tables Used
- **academic_periods**: Fetch all sequences for the selected year
- **grades**: Fetch all grades for the sequences
- **students**: Student information (name, class, matricule)
- **classes**: Class information
- **sections**: Section information (Francophone/Anglophone)
- **subjects**: Subject information
- **subject_groups**: Subject group information
- **level_subjects**: Coefficient lookup for proper weighting
- **student_unranked_periods**: Respect student ranking exclusions

### Query Pattern
```typescript
// 1. Fetch all sequences for the academic year
const periods = await supabase
  .from("academic_periods")
  .select("*")
  .eq("type", "sequence")
  .eq("academic_year", academicYear)

// 2. Fetch grades with full relationships
const grades = await supabase
  .from("grades")
  .select(`
    id, score, coefficient, student_id, subject_id, academic_period_id,
    subject:subjects(...),
    student:students(...),
    level_subject:level_subjects(coefficient)
  `)
  .in("academic_period_id", periodIds)

// 3. Group and calculate averages
// (See page.tsx for complete calculation logic)
```

## 🎨 Design & UX

### Color Scheme
- **Primary**: #1E40AF (Blue)
- **Success**: #16A34A (Green) 
- **Warning**: #EAB308 (Yellow)
- **Danger**: #DC2626 (Red)
- **Excellence**: #8B5CF6 (Purple)
- **Sequence Colors**: Array of 6 distinct colors for sequence differentiation

### Responsive Design
- **Mobile**: Single-column layout, collapsible elements
- **Tablet**: Two-column grid for KPIs
- **Desktop**: Full 4-column KPI grid, wide charts
- All charts use `ResponsiveContainer` for responsiveness

### Interactive Elements
- Real-time filter updates (no page reload)
- Hover tooltips on charts
- Language toggle buttons
- Print functionality (via `window.print()`)
- Scrollable table for large student lists

## 📝 File Structure

```
app/
└── reports/
    └── annual-bulletin/
        └── page.tsx (826 lines)
            - Full implementation with all features
            - Self-contained component
            - Uses shadcn/ui components
            - Uses Recharts for visualizations
```

## 🔄 State Management

Uses React hooks for state:
- `loading`: Track data fetching state
- `language`: Current language (fr/en)
- `academicYear`: Selected academic year
- `selectedSection`: Filtered section
- `activeTab`: Currently active tab
- `sequenceData`: Processed data per sequence
- `annualStudents`: Calculated student summaries
- `schoolStats`: Aggregated statistics

## ⚡ Performance Considerations

- **Memoization**: `useMemo` for chart data generation
- **Lazy Loading**: Charts render only when tab is active
- **Filtering**: Done in-memory after initial fetch
- **Coefficients**: Cached in Map for O(1) lookup
- **Unranked Periods**: Efficiently filtered using Set membership

## 🚀 Future Enhancements

Possible extensions:
1. **Export to PDF**: Using jsPDF + jsPDF-AutoTable
2. **Comparison Mode**: Compare multiple sections/years
3. **Teacher-Specific View**: Filter by teacher for their subjects
4. **Trend Analysis**: Multi-year comparison
5. **Custom Date Range**: Instead of fixed sequences
6. **Email Reports**: Auto-send to administrators
7. **Mobile App**: Responsive improvements for phones

## 🐛 Known Limitations

1. **No Caching**: Data is fetched fresh each time (could use React Query)
2. **No Pagination**: Table scrolls instead of paginating (could limit rows)
3. **Simple Sorting**: Only by average (could add multi-column sort)
4. **No Comments**: Doesn't include teacher comments on performance
5. **No Attendance Data**: Doesn't correlate with absences

## 📖 Usage Example

```tsx
// Page is self-contained and requires no props
<AnnualBulletinPage />

// Automatically:
// 1. Detects browser language
// 2. Fetches academic years from DB
// 3. Loads latest academic year by default
// 4. Calculates statistics in real-time
// 5. Renders all charts and tables
```

---

**Last Updated**: June 11, 2026
**Version**: 1.0
**Status**: Production Ready
