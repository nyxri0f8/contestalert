import fs from 'fs';

let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Remove Stats from Hero Section
const statsStart = page.indexOf('            {/* Program Stats */}');
if (statsStart !== -1) {
  const statsEnd = page.indexOf('          </div>', statsStart);
  if (statsEnd !== -1) {
    page = page.substring(0, statsStart) + page.substring(statsEnd);
  }
}

// 2. Update StudentLeaderboardSection
const studentStateStart = page.indexOf('function StudentLeaderboardSection() {\n  const [leaderboard]');
if (studentStateStart !== -1) {
  const studentStateEnd = page.indexOf('  return (', studentStateStart);
  if (studentStateEnd !== -1) {
    const newStudentState = `function StudentLeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStudentLeaderboard() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('name, department, achievement_points')
          .eq('role', 'student')
          .order('achievement_points', { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          const maxPoints = data[0].achievement_points || 1;
          setLeaderboard(data.map((p, i) => ({
            rank: i + 1,
            name: p.name || 'Unknown',
            branch: p.department || 'N/A',
            events: '-', 
            points: p.achievement_points || 0,
            percentage: ((p.achievement_points || 0) / maxPoints) * 100
          })));
        }
      } catch (err) {
        console.error('Failed to load student leaderboard:', err);
      }
    }
    fetchStudentLeaderboard();
  }, []);

`;
    page = page.substring(0, studentStateStart) + newStudentState + page.substring(studentStateEnd);
  }
}

// 3. Update DepartmentLeaderboardSection
const deptStateStart = page.indexOf('function DepartmentLeaderboardSection() {\n  const [leaderboard]');
if (deptStateStart !== -1) {
  const deptStateEnd = page.indexOf('  return (', deptStateStart);
  if (deptStateEnd !== -1) {
    const newDeptState = `function DepartmentLeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDeptLeaderboard() {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc('get_department_leaderboard');
        if (data && data.length > 0) {
          const maxPoints = Math.max(...data.map((d: any) => parseInt(d.total_points) || 0), 1);
          setLeaderboard(data.slice(0, 5).map((d: any, i: number) => ({
            rank: i + 1,
            department: d.department,
            points: parseInt(d.total_points) || 0,
            participants: parseInt(d.total_registrations) || 0,
            wins: parseInt(d.total_wins) || 0,
            percentage: ((parseInt(d.total_points) || 0) / maxPoints) * 100
          })));
        }
      } catch (err) {
        console.error('Failed to load department leaderboard:', err);
      }
    }
    fetchDeptLeaderboard();
  }, []);

`;
    page = page.substring(0, deptStateStart) + newDeptState + page.substring(deptStateEnd);
  }
}

fs.writeFileSync('src/app/page.tsx', page);
console.log('Landing page updated with real data.');
