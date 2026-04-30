// Simulate the calendar logic for different months in 2026

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function buildCalendarDays(year, monthIndex) {
  const currentDate = new Date(year, monthIndex, 1);
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Add padding
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add month days
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  
  for (let i = 1; i <= daysInMonth; i++) {
    const day = String(i).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    days.push(dateStr);
  }

  // Pad end
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

// Test April and May 2026
console.log("=== April 2026 ===");
const aprilDays = buildCalendarDays(2026, 3); // month 3 = April
const aprilNonNull = aprilDays.filter(d => d !== null);
console.log("Total days:", aprilNonNull.length);
console.log("First date:", aprilNonNull[0]);
console.log("Last date:", aprilNonNull[aprilNonNull.length - 1]);
console.log("Last 3 dates:", aprilNonNull.slice(-3));

console.log("\n=== May 2026 ===");
const mayDays = buildCalendarDays(2026, 4); // month 4 = May
const mayNonNull = mayDays.filter(d => d !== null);
console.log("Total days:", mayNonNull.length);
console.log("First date:", mayNonNull[0]);
console.log("Last date:", mayNonNull[mayNonNull.length - 1]);
console.log("First 3 dates:", mayNonNull.slice(0, 3));

// Check if April 30 appears in May calendar
console.log("\n=== CROSS-MONTH CHECK ===");
console.log("April 30 in May calendar?", mayNonNull.includes("2026-04-30"));
console.log("May 1 in April calendar?", aprilNonNull.includes("2026-05-01"));

// Validate month boundaries
console.log("\n=== MONTH BOUNDARY VALIDATION ===");
aprilNonNull.forEach((dateStr) => {
  const [y, m, d] = dateStr.split('-');
  if (m !== '04') {
    console.error(`ERROR: April calendar contains ${dateStr}`);
  }
});

mayNonNull.forEach((dateStr) => {
  const [y, m, d] = dateStr.split('-');
  if (m !== '05') {
    console.error(`ERROR: May calendar contains ${dateStr}`);
  }
});

console.log("✓ No cross-month contamination detected in logic");
