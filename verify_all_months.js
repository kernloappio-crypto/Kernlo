// Comprehensive 2026 month boundary verification

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  
  for (let i = 1; i <= daysInMonth; i++) {
    const day = String(i).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    days.push(dateStr);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function isDateInMonth(dateStr, month, year) {
  const [y, m] = dateStr.split('-');
  return parseInt(y, 10) === year && parseInt(m, 10) === month;
}

let allPass = true;

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║ 2026 CALENDAR MONTH BOUNDARY VERIFICATION                  ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

for (let month = 1; month <= 12; month++) {
  const monthName = MONTH_NAMES[month - 1];
  const days = buildCalendarDays(2026, month - 1);
  const dateDays = days.filter(d => d !== null);
  
  console.log(`📅 ${monthName} 2026 (Month ${month})`);
  console.log(`   Days in month: ${dateDays.length}`);
  console.log(`   First date: ${dateDays[0]}`);
  console.log(`   Last date: ${dateDays[dateDays.length - 1]}`);
  
  // Validate all dates belong to this month
  let monthValid = true;
  dateDays.forEach((dateStr, idx) => {
    if (!isDateInMonth(dateStr, month, 2026)) {
      console.log(`   ❌ FAIL: Cell ${idx} has cross-month date ${dateStr}`);
      monthValid = false;
      allPass = false;
    }
  });
  
  if (monthValid) {
    console.log(`   ✅ PASS: All dates in strict month boundary`);
  }
  
  // Check for common boundary issues
  const firstOfMonth = dateDays[0];
  const lastOfMonth = dateDays[dateDays.length - 1];
  
  const [_, firstM, firstD] = firstOfMonth.split('-');
  const [__, lastM, lastD] = lastOfMonth.split('-');
  
  if (parseInt(firstD, 10) !== 1) {
    console.log(`   ❌ FAIL: First date should be day 1, got day ${parseInt(firstD, 10)}`);
    allPass = false;
  }
  if (parseInt(lastM, 10) !== month) {
    console.log(`   ❌ FAIL: Last date month mismatch`);
    allPass = false;
  }
  
  console.log();
}

// Special focus tests mentioned in requirements
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║ SPECIAL BOUNDARY TESTS                                     ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// January: should not have Dec 31
console.log("January 2026 (should NOT contain Dec 31):");
const jan = buildCalendarDays(2026, 0).filter(d => d !== null);
const hasDecInJan = jan.some(d => d === '2025-12-31');
console.log(`   Contains 2025-12-31? ${hasDecInJan ? '❌ FAIL' : '✅ PASS'}`);
if (hasDecInJan) allPass = false;

// April: should not have Mar 31 or May 1
console.log("\nApril 2026 (should NOT contain Mar 31 or May 1):");
const apr = buildCalendarDays(2026, 3).filter(d => d !== null);
const hasMarInApr = apr.some(d => d === '2026-03-31');
const hasMayInApr = apr.some(d => d === '2026-05-01');
console.log(`   Contains 2026-03-31? ${hasMarInApr ? '❌ FAIL' : '✅ PASS'}`);
console.log(`   Contains 2026-05-01? ${hasMayInApr ? '❌ FAIL' : '✅ PASS'}`);
if (hasMarInApr || hasMayInApr) allPass = false;

// May: should not have Apr 30
console.log("\nMay 2026 (should NOT contain Apr 30):");
const may = buildCalendarDays(2026, 4).filter(d => d !== null);
const hasAprInMay = may.some(d => d === '2026-04-30');
console.log(`   Contains 2026-04-30? ${hasAprInMay ? '❌ FAIL' : '✅ PASS'}`);
if (hasAprInMay) allPass = false;

// December: should not have Jan 1 (of next year)
console.log("\nDecember 2026 (should NOT contain Jan 1, 2027):");
const dec = buildCalendarDays(2026, 11).filter(d => d !== null);
const hasJanInDec = dec.some(d => d === '2027-01-01');
console.log(`   Contains 2027-01-01? ${hasJanInDec ? '❌ FAIL' : '✅ PASS'}`);
if (hasJanInDec) allPass = false;

console.log("\n" + "═".repeat(60));
if (allPass) {
  console.log("✅ ALL TESTS PASSED - NO MONTH BOUNDARY LEAKAGE DETECTED");
} else {
  console.log("❌ TESTS FAILED - MONTH BOUNDARY ISSUES DETECTED");
  process.exit(1);
}
console.log("═".repeat(60));
