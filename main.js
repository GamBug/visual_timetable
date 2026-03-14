const subjects = [];
const colorClasses = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6'];
let colorCounter = 0;
const courseColorMap = {}; // Map courseCode to color for consistent coloring
let selectedWeek = 'all'; // Current selected week filter

// localStorage key for saving schedule data
const STORAGE_KEY = 'tkb-schedule-data';

// Save schedule data to localStorage
function saveToLocalStorage() {
    const data = {
        subjects: subjects,
        colorCounter: colorCounter,
        courseColorMap: courseColorMap
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Load schedule data from localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);

            // Restore subjects
            if (data.subjects && Array.isArray(data.subjects)) {
                subjects.length = 0; // Clear existing
                subjects.push(...data.subjects);
            }

            // Restore color counter
            if (typeof data.colorCounter === 'number') {
                colorCounter = data.colorCounter;
            }

            // Restore course color map
            if (data.courseColorMap) {
                Object.keys(courseColorMap).forEach(key => delete courseColorMap[key]);
                Object.assign(courseColorMap, data.courseColorMap);
            }

            return true;
        } catch (e) {
            console.error('Error loading saved data:', e);
            return false;
        }
    }
    return false;
}

// Parse week string like "25-32,34-42" into array [25,26,27,...,32,34,35,...,42]
function parseWeeks(weekStr) {
    if (!weekStr || weekStr.trim() === '') return [];

    const weeks = [];
    const parts = weekStr.split(',');

    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(Number);
            for (let i = start; i <= end; i++) {
                if (!weeks.includes(i)) weeks.push(i);
            }
        } else {
            const num = parseInt(trimmed);
            if (!isNaN(num) && !weeks.includes(num)) weeks.push(num);
        }
    }

    return weeks.sort((a, b) => a - b);
}

// Academic calendar - Week start dates (based on HUST calendar)
// Format: weekNumber -> start date (first day of that week)
const academicCalendar = {
    1: new Date('2025-09-08'),   // 8/9/25
    2: new Date('2025-09-15'),   // 15/9/25
    3: new Date('2025-09-22'),   // 22/9/25
    4: new Date('2025-09-29'),   // 29/9/25
    5: new Date('2025-10-06'),   // 6/10/25
    6: new Date('2025-10-13'),   // 13/10/25
    7: new Date('2025-10-20'),   // 20/10/25
    8: new Date('2025-10-27'),   // 27/10/25
    9: new Date('2025-11-03'),   // 3/11/25
    10: new Date('2025-11-10'),  // 10/11/25
    11: new Date('2025-11-17'),  // 17/11/25
    12: new Date('2025-11-24'),  // 24/11/25
    13: new Date('2025-12-01'),  // 1/12/25
    14: new Date('2025-12-08'),  // 8/12/25
    15: new Date('2025-12-15'),  // 15/12/25
    16: new Date('2025-12-22'),  // 22/12/25
    17: new Date('2025-12-29'),  // 29/12/25
    18: new Date('2026-01-05'),  // 5/1/26
    19: new Date('2026-01-12'),  // 12/1/26
    20: new Date('2026-01-19'),  // 19/1/26
    21: new Date('2026-01-26'),  // 26/1/26
    22: new Date('2026-02-02'),  // 2/2/26
    23: new Date('2026-02-09'),  // 9/2/26
    24: new Date('2026-02-16'),  // 16/2/26
    25: new Date('2026-02-23'),  // 23/2/26
    26: new Date('2026-03-02'),  // 2/3/26
    27: new Date('2026-03-09'),  // 9/3/26
    28: new Date('2026-03-16'),  // 16/3/26
    29: new Date('2026-03-23'),  // 23/3/26
    30: new Date('2026-03-30'),  // 30/3/26
    31: new Date('2026-04-06'),  // 6/4/26
    32: new Date('2026-04-13'),  // 13/4/26
    33: new Date('2026-04-20'),  // 20/4/26
    34: new Date('2026-04-27'),  // 27/4/26
    35: new Date('2026-05-04'),  // 4/5/26
    36: new Date('2026-05-11'),  // 11/5/26
    37: new Date('2026-05-18'),  // 18/5/26
    38: new Date('2026-05-25'),  // 25/5/26
    39: new Date('2026-06-01'),  // 1/6/26
    40: new Date('2026-06-08'),  // 8/6/26
    41: new Date('2026-06-15'),  // 15/6/26
    42: new Date('2026-06-22'),  // 22/6/26
    43: new Date('2026-06-29'),  // 29/6/26
    44: new Date('2026-07-06'),  // 6/7/26
    45: new Date('2026-07-13'),  // 13/7/26
    46: new Date('2026-07-20'),  // 20/7/26
    47: new Date('2026-07-27'),  // 27/7/26
    48: new Date('2026-08-03'),  // 3/8/26
    49: new Date('2026-08-10'),  // 10/8/26
    50: new Date('2026-08-17'),  // 17/8/26
    51: new Date('2026-08-24'),  // 24/8/26
    52: new Date('2026-08-31'),  // 31/8/26
};

// Get current academic week based on the academic calendar
function getCurrentAcademicWeek() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find which week we're in
    for (let week = 52; week >= 1; week--) {
        if (academicCalendar[week] && today >= academicCalendar[week]) {
            return week;
        }
    }
    return 1; // Default to week 1 if before calendar starts
}

// Get date range for a specific week
function getWeekDateRange(weekNum) {
    if (!academicCalendar[weekNum]) return '';

    const startDate = academicCalendar[weekNum];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const formatDate = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// Get all weeks that have classes
function getWeeksWithClasses() {
    const weeksSet = new Set();
    subjects.forEach(subject => {
        if (subject.weeks && subject.weeks.length > 0) {
            subject.weeks.forEach(w => weeksSet.add(w));
        }
    });
    return weeksSet;
}

// Update week selector to mark weeks with classes
function updateWeekSelectorMarking() {
    const select = document.getElementById('weekSelect');
    const weeksWithClasses = getWeeksWithClasses();

    for (let i = 1; i < select.options.length; i++) {
        const option = select.options[i];
        const weekNum = parseInt(option.value);
        const dateRange = getWeekDateRange(weekNum);

        if (weeksWithClasses.has(weekNum)) {
            option.textContent = `📚 Tuần ${weekNum} (${dateRange})`;
            option.style.fontWeight = 'bold';
        } else {
            option.textContent = `Tuần ${weekNum} (${dateRange})`;
            option.style.fontWeight = 'normal';
        }
    }
}

// Initialize week selector dropdown
function initWeekSelector() {
    const select = document.getElementById('weekSelect');

    // Add options for weeks 1-52
    for (let i = 1; i <= 52; i++) {
        const option = document.createElement('option');
        option.value = i;
        const dateRange = getWeekDateRange(i);
        option.textContent = `Tuần ${i} (${dateRange})`;
        select.appendChild(option);
    }

    // Event listener for week selection
    select.addEventListener('change', function () {
        selectedWeek = this.value;
        updateWeekInfo();
        renderSchedule();
    });

    // Current week button
    document.getElementById('currentWeekBtn').addEventListener('click', function () {
        const currentWeek = getCurrentAcademicWeek();
        selectedWeek = currentWeek.toString();
        document.getElementById('weekSelect').value = currentWeek;
        updateWeekInfo();
        renderSchedule();
    });

    // Previous week button
    document.getElementById('prevWeekBtn').addEventListener('click', function () {
        navigateWeek(-1);
    });

    // Next week button
    document.getElementById('nextWeekBtn').addEventListener('click', function () {
        navigateWeek(1);
    });

    updateWeekInfo();
}

// Navigate to previous or next week
function navigateWeek(direction) {
    const select = document.getElementById('weekSelect');

    if (selectedWeek === 'all') {
        // If viewing all weeks, start from current week
        const currentWeek = getCurrentAcademicWeek();
        selectedWeek = currentWeek.toString();
    }

    let newWeek = parseInt(selectedWeek) + direction;

    // Wrap around: week 0 -> 52, week 53 -> 1
    if (newWeek < 1) newWeek = 52;
    if (newWeek > 52) newWeek = 1;

    selectedWeek = newWeek.toString();
    select.value = newWeek;
    updateWeekInfo();
    renderSchedule();
}

// Update week info display
function updateWeekInfo() {
    const infoSpan = document.getElementById('weekInfo');
    const currentWeek = getCurrentAcademicWeek();

    if (selectedWeek === 'all') {
        infoSpan.textContent = `(Tuần hiện tại: ${currentWeek})`;
    } else {
        const selected = parseInt(selectedWeek);
        if (selected === currentWeek) {
            infoSpan.textContent = '✓ Đang xem tuần hiện tại';
        } else if (selected < currentWeek) {
            infoSpan.textContent = `(${currentWeek - selected} tuần trước)`;
        } else {
            infoSpan.textContent = `(${selected - currentWeek} tuần sau)`;
        }
    }
}

// Theme management
const THEME_KEY = 'tkb-theme';
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDarkMode = savedTheme === 'dark';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateThemeToggle();
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    updateThemeToggle();
}

function updateThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        const isDarkMode = document.body.classList.contains('dark-mode');
        toggle.textContent = isDarkMode ? '🌙' : '☀️';
        toggle.title = isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối';
    }
}

// Session time mapping
const sessionTimes = {
    1: '6:45 - 7:30',
    2: '7:30 - 8:15',
    3: '8:25 - 9:10',
    4: '9:20 - 10:05',
    5: '10:15 - 11:00',
    6: '11:00 - 11:45',
    7: '12:30 - 13:15',
    8: '13:15 - 14:00',
    9: '14:10 - 14:55',
    10: '15:05 - 15:50',
    11: '16:00 - 16:45',
    12: '16:45 - 17:30'
};

// Check if two week arrays have any overlap
function hasWeekOverlap(weeks1, weeks2) {
    // If either has no weeks defined, assume they overlap (can conflict any week)
    if (!weeks1 || weeks1.length === 0 || !weeks2 || weeks2.length === 0) {
        return true;
    }
    // Check if any week appears in both arrays
    return weeks1.some(w => weeks2.includes(w));
}

function hasScheduleConflict(day, startSession, endSession, excludeId = null, newWeeks = null) {
    // Check if there's a conflict with existing subjects
    return subjects.some(subject => {
        // Skip the current subject being edited
        if (excludeId !== null && subject.id === excludeId) {
            return false;
        }

        // Check if same day
        if (subject.day !== day) {
            return false;
        }

        // Check if sessions overlap
        // Sessions overlap if: newStart <= existingEnd AND newEnd >= existingStart
        const sessionOverlap = startSession <= subject.endSession && endSession >= subject.startSession;
        if (!sessionOverlap) {
            return false;
        }

        // Check if weeks overlap (if both have week data)
        // Classes with overlapping day/session but different weeks are NOT conflicts
        const weekOverlap = hasWeekOverlap(newWeeks, subject.weeks);
        return weekOverlap;
    });
}

function getColorForCourse(courseCode) {
    // Get or assign color for a course code
    if (!courseColorMap[courseCode]) {
        courseColorMap[courseCode] = colorClasses[colorCounter % colorClasses.length];
        colorCounter++;
    }
    return courseColorMap[courseCode];
}

function initializeTable() {
    const body = document.getElementById('scheduleBody');
    body.innerHTML = '';

    for (let session = 1; session <= 12; session++) {
        const row = document.createElement('tr');
        const timeInfo = sessionTimes[session];
        row.innerHTML = `<td class="time-col"><div class="session-number">Tiết ${session}</div><div class="session-time">${timeInfo}</div></td>`;

        for (let day = 2; day <= 7; day++) {
            const cell = document.createElement('td');
            cell.className = 'subject-cell';
            cell.id = `cell-${day}-${session}`;
            row.appendChild(cell);
        }
        body.appendChild(row);

        // Add break row after session 6
        if (session === 6) {
            const breakRow = document.createElement('tr');
            breakRow.className = 'break-row';
            breakRow.innerHTML = `<td class="break-cell" colspan="7">☕ Giờ nghỉ trưa</td>`;
            body.appendChild(breakRow);
        }
    }
}

function addSubject(event) {
    event.preventDefault();

    const subjectName = document.getElementById('subjectName').value;
    const subjectCode = document.getElementById('subjectCode').value;
    const day = document.getElementById('day').value;
    const startSession = parseInt(document.getElementById('startSession').value);
    const endSession = parseInt(document.getElementById('endSession').value);
    const room = document.getElementById('room').value;

    if (startSession > endSession) {
        alert('Tiết bắt đầu phải nhỏ hơn hoặc bằng tiết kết thúc!');
        return;
    }

    // Check for schedule conflict
    if (hasScheduleConflict(day, startSession, endSession)) {
        alert('⚠️ Trùng lịch! Có môn học khác cùng thứ trong khung giờ này.\nVui lòng chọn thời gian khác.');
        return;
    }

    const subject = {
        id: Date.now(),
        name: subjectName,
        code: subjectCode,
        day: day,
        startSession: startSession,
        endSession: endSession,
        room: room,
        color: getColorForCourse(subjectCode),
        isPE: isPESubject(subjectCode)
    };

    subjects.push(subject);
    saveToLocalStorage();
    renderSchedule();
    document.getElementById('scheduleForm').reset();
}

function clearSubjects() {
    // Clear all subject divs from cells without resetting table structure
    const allCells = document.querySelectorAll('.subject-cell');
    allCells.forEach(cell => {
        // Remove all child divs (subjects)
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
        // Reset rowspan to 1
        cell.rowSpan = 1;
        cell.style.display = '';
    });
}

function renderSchedule() {
    // Clear old subjects without resetting table structure
    clearSubjects();

    // Filter subjects by selected week
    const filteredSubjects = selectedWeek === 'all'
        ? subjects
        : subjects.filter(subject => {
            if (!subject.weeks || subject.weeks.length === 0) return true; // Show if no week data
            return subject.weeks.includes(parseInt(selectedWeek));
        });

    // Render subjects
    filteredSubjects.forEach(subject => {
        const cell = document.getElementById(`cell-${subject.day}-${subject.startSession}`);
        const rowspan = subject.endSession - subject.startSession + 1;

        const subjectDiv = document.createElement('div');
        // Add 'subject-pe' class if it's a PE subject to show only 50% height
        let className = `subject ${subject.color}`;
        if (subject.isPE) {
            className += ' subject-pe';
        }
        subjectDiv.className = className;
        subjectDiv.innerHTML = `
            <div class="subject-name">${subject.name}</div>
            <div class="subject-code">${subject.code}</div>
            <div class="subject-room">${subject.room}</div>
            ${subject.type ? `<div class="subject-type">${subject.type}</div>` : ''}
            <button class="delete-btn" onclick="deleteSubject(${subject.id})">✕</button>
        `;

        cell.appendChild(subjectDiv);
        cell.rowSpan = rowspan;

        // Hide cells that are part of this subject's rowspan using CSS
        for (let i = subject.startSession + 1; i <= subject.endSession; i++) {
            const hiddenCell = document.getElementById(`cell-${subject.day}-${i}`);
            if (hiddenCell) {
                hiddenCell.style.display = 'none';
            }
        }
    });

    // Update week selector to mark weeks with classes
    updateWeekSelectorMarking();

    // Update class list table
    renderClassList();
}

function deleteSubject(id) {
    const index = subjects.findIndex(s => s.id === id);
    if (index > -1) {
        const deletedSubject = subjects[index];
        const courseCode = deletedSubject.code;

        subjects.splice(index, 1);
        colorCounter--;

        // Check if this course code is still used by any other subject
        const courseStillExists = subjects.some(s => s.code === courseCode);
        if (!courseStillExists) {
            // If not, remove it from the color map
            delete courseColorMap[courseCode];
        }

        saveToLocalStorage();
        renderSchedule();
    }
}

function resetSchedule() {
    if (confirm('Bạn có chắc muốn xóa tất cả môn học?')) {
        subjects.length = 0;
        colorCounter = 0;
        // Clear course color mapping when resetting
        for (let key in courseColorMap) {
            delete courseColorMap[key];
        }
        saveToLocalStorage();
        renderSchedule();
    }
}

function normalizeTimeToSession(timeStr) {
    // Convert time format "HH:MM" to session number with tolerance ±5 minutes
    const [hours, mins] = timeStr.split(':').map(Number);
    const inputMins = hours * 60 + mins;

    let closestSession = null;
    let minDifference = Infinity;
    let normalizedTime = null;

    // Find the closest session start time
    for (const [session, range] of Object.entries(sessionTimes)) {
        const [start, end] = range.split(' - ');
        const [sHour, sMin] = start.split(':').map(Number);

        const startMins = sHour * 60 + sMin;
        const difference = Math.abs(inputMins - startMins);

        // If input matches session start time within tolerance
        if (difference <= 5) {
            if (difference < minDifference) {
                minDifference = difference;
                closestSession = parseInt(session);
                normalizedTime = start;
            }
        }
    }

    if (closestSession !== null) {
        return { session: closestSession, normalizedTime: normalizedTime };
    }

    return null; // Outside tolerance
}

function isPESubject(courseCode) {
    // Check if subject is PE (thể dục) based on course code starting with PE
    return courseCode.match(/^PE\d+/i) !== null;
}

function getClosestSession(timeStr) {
    // Get session containing the time or first session >= time
    // For PE subjects that don't fit exactly in session boundaries
    const [hours, mins] = timeStr.split(':').map(Number);
    const inputMins = hours * 60 + mins;

    // First try: find session that contains this time
    for (const [session, range] of Object.entries(sessionTimes)) {
        const [start, end] = range.split(' - ');
        const [sHour, sMin] = start.split(':').map(Number);
        const [eHour, eMin] = end.split(':').map(Number);

        const startMins = sHour * 60 + sMin;
        const endMins = eHour * 60 + eMin;

        if (inputMins >= startMins && inputMins <= endMins) {
            return parseInt(session);
        }
    }

    // Second try: find first session that starts after or close to this time
    let closestSession = null;
    let minDifference = Infinity;

    for (const [session, range] of Object.entries(sessionTimes)) {
        const [start, end] = range.split(' - ');
        const [sHour, sMin] = start.split(':').map(Number);

        const startMins = sHour * 60 + sMin;
        // Only consider sessions that start at or before the input time
        if (startMins <= inputMins) {
            const difference = inputMins - startMins;
            if (difference < minDifference) {
                minDifference = difference;
                closestSession = parseInt(session);
            }
        }
    }

    return closestSession;
}

// Parse multi-session subject (môn học chia thành nhiều buổi)
function parseMultiSessionSubject(groupLines, groupIndex, errorMessages) {
    const dayMap = {
        'T2': '2', 'T3': '3', 'T4': '4', 'T5': '5', 'T6': '6', 'T7': '7'
    };

    try {
        // Count how many day patterns (T\d (S/C/T)) are in this group
        const dayPatterns = [];
        for (let i = 1; i < groupLines.length; i++) {
            const dayMatch = groupLines[i].match(/T(\d)\s*\(([SCT])\)/i);
            if (dayMatch) {
                dayPatterns.push({ line: i, match: dayMatch });
            } else {
                break; // Stop when no more day patterns found
            }
        }

        if (dayPatterns.length === 0) {
            return null; // Not a multi-session format
        }

        const sessionCount = dayPatterns.length;
        const parsedSubjects = []; // Collect all subjects for this group

        // Expected structure for multi-session:
        // Line 0: STT
        // Lines 1 to sessionCount: Days (T\d (S/C/T))
        // Lines (sessionCount+1) to (2*sessionCount): Session ranges
        // Lines (2*sessionCount+1) to (3*sessionCount): Weeks
        // Lines (3*sessionCount+1) to (4*sessionCount): Rooms
        // Last line: Tab-separated class info

        const expectedLines = 4 * sessionCount + 1;
        if (groupLines.length < expectedLines) {
            errorMessages.push(`Lớp ${groupIndex + 1}: Format multi-session thiếu dữ liệu (cần ${expectedLines} dòng, có ${groupLines.length})`);
            return null;
        }

        const subjects = [];

        // Get class info once (same for all sessions in multi-session)
        const lastLineParts = groupLines[groupLines.length - 1].split('\t');
        if (lastLineParts.length < 3) {
            errorMessages.push(`Lớp ${groupIndex}: Thiếu thông tin môn học`);
            return null;
        }

        const courseCode = lastLineParts[1].trim();
        const isPE = isPESubject(courseCode);

        for (let session = 0; session < sessionCount; session++) {
            const dayMatch = dayPatterns[session].match;
            const day = dayMap['T' + dayMatch[1]];
            const timeSlot = dayMatch[2].toUpperCase();

            // Get session range
            const sessionLine = groupLines[sessionCount + 1 + session];
            let startSession, endSession;

            let sessionMatch = sessionLine.match(/Tiết\s*(\d+)\s*-\s*(\d+)/i);
            if (sessionMatch) {
                startSession = parseInt(sessionMatch[1]);
                endSession = parseInt(sessionMatch[2]);
            } else {
                sessionMatch = sessionLine.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
                if (sessionMatch) {
                    const startTime = `${sessionMatch[1]}:${sessionMatch[2]}`;
                    const endTime = `${sessionMatch[3]}:${sessionMatch[4]}`;

                    if (isPE) {
                        // For PE subjects, use closest session
                        startSession = getClosestSession(startTime);
                        endSession = getClosestSession(endTime);
                    } else {
                        const startResult = normalizeTimeToSession(startTime);
                        const endResult = normalizeTimeToSession(endTime);

                        if (!startResult || !endResult) {
                            errorMessages.push(`Lớp ${groupIndex}, buổi ${session + 1}: Không thể convert thời gian (chêch lệch > 5 phút)`);
                            return null;
                        }

                        startSession = startResult.session;
                        endSession = endResult.session;
                    }
                } else {
                    errorMessages.push(`Lớp ${groupIndex}, buổi ${session + 1}: Format tiết không hợp lệ`);
                    return null;
                }
            }

            // Adjust sessions based on time slot
            if (timeSlot === 'C' || timeSlot === 'T') {
                if (startSession <= 6 && endSession <= 6) {
                    startSession += 6;
                    endSession += 6;
                }
            }

            // Get room
            const room = groupLines[3 * sessionCount + 1 + session].trim();

            // Get weeks from line (2*sessionCount+1) + session
            const weekStr = groupLines[2 * sessionCount + 1 + session].trim();
            const weeks = parseWeeks(weekStr);

            // Get remaining class info
            const subjectName = lastLineParts[2].trim();
            const classType = lastLineParts.length > 3 ? lastLineParts[3].trim() : '';

            const subject = {
                id: Date.now() * 1000 + groupIndex * 100 + session * 10 + Math.floor(Math.random() * 10),
                name: subjectName,
                code: courseCode,
                day: day,
                startSession: startSession,
                endSession: endSession,
                room: room,
                type: classType,
                color: getColorForCourse(courseCode),
                isPE: isPE,
                weeks: weeks
            };

            parsedSubjects.push(subject);
        }

        return parsedSubjects;

    } catch (error) {
        errorMessages.push(`Lớp ${groupIndex + 1}: ${error.message}`);
        return null;
    }
}

function importFromText() {
    const bulkText = document.getElementById('bulkImportText').value.trim();

    if (!bulkText) {
        alert('Vui lòng nhập dữ liệu!');
        return;
    }

    // Split by lines
    const lines = bulkText.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 5) {
        alert('Định dạng không hợp lệ!');
        return;
    }

    try {
        // Find all STT indices (lines that are just numbers)
        const sttIndices = [];
        for (let i = 0; i < lines.length; i++) {
            if (/^\d+$/.test(lines[i])) {
                sttIndices.push(i);
            }
        }

        if (sttIndices.length === 0) {
            alert('Không tìm thấy STT (số thứ tự). Mỗi lớp phải bắt đầu bằng một số.');
            return;
        }

        // Extract subject groups
        const subjectGroups = [];
        for (let i = 0; i < sttIndices.length; i++) {
            const startIdx = sttIndices[i];
            const endIdx = (i < sttIndices.length - 1) ? sttIndices[i + 1] : lines.length;
            const groupLines = lines.slice(startIdx, endIdx);
            subjectGroups.push(groupLines);
        }

        // Process each subject group
        let successCount = 0;
        let errorMessages = [];
        const parsedSubjects = []; // Collect all subjects before adding to main array

        subjectGroups.forEach((groupLines, groupIndex) => {
            try {
                if (groupLines.length < 5) {
                    errorMessages.push(`Lớp ${groupIndex + 1}: Thiếu dữ liệu`);
                    return;
                }

                // Check if this is a multi-session subject (multiple T\d (S/C/T) patterns)
                const dayMatch = groupLines[1].match(/T(\d)\s*\(([SCT])\)/i);
                if (!dayMatch) {
                    errorMessages.push(`Lớp ${groupIndex + 1}: Format thứ không hợp lệ`);
                    return;
                }

                // Check for multi-session format (line 2 also starts with T\d)
                const secondDayMatch = groupLines[2] ? groupLines[2].match(/T(\d)\s*\(([SCT])\)/i) : null;

                if (secondDayMatch) {
                    // This is a multi-session subject
                    const multiSessionSubjects = parseMultiSessionSubject(groupLines, groupIndex + 1, errorMessages);
                    if (multiSessionSubjects) {
                        parsedSubjects.push(...multiSessionSubjects);
                        successCount += multiSessionSubjects.length;
                    }
                    return;
                }

                // Single-session format
                const dayMap = {
                    'T2': '2', 'T3': '3', 'T4': '4', 'T5': '5', 'T6': '6', 'T7': '7'
                };
                const day = dayMap['T' + dayMatch[1]];
                const timeSlot = dayMatch[2].toUpperCase();

                // Get course code early to check if PE subject
                const lastLineParts = groupLines[5].split('\t');
                if (lastLineParts.length < 3) {
                    errorMessages.push(`Lớp ${groupIndex + 1}: Thiếu thông tin môn học`);
                    return;
                }
                const courseCode = lastLineParts[1].trim();
                const isPE = isPESubject(courseCode);

                // Line 2: Sessions (can be "Tiết 1-3" or "HH:MM-HH:MM")
                let startSession, endSession;

                // Try "Tiết X-Y" format first
                let sessionMatch = groupLines[2].match(/Tiết\s*(\d+)\s*-\s*(\d+)/i);
                if (sessionMatch) {
                    startSession = parseInt(sessionMatch[1]);
                    endSession = parseInt(sessionMatch[2]);
                } else {
                    // Try "HH:MM-HH:MM" format with tolerance
                    sessionMatch = groupLines[2].match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
                    if (sessionMatch) {
                        const startTime = `${sessionMatch[1]}:${sessionMatch[2]}`;
                        const endTime = `${sessionMatch[3]}:${sessionMatch[4]}`;

                        if (isPE) {
                            // For PE subjects, use closest session without strict tolerance
                            startSession = getClosestSession(startTime);
                            endSession = getClosestSession(endTime);
                            console.log(`Môn PE ${courseCode}: Sử dụng tiết gần nhất ${startTime}-${endTime} → Tiết ${startSession}-${endSession}`);
                        } else {
                            // Use normalizeTimeToSession for tolerance (±5 minutes) for regular subjects
                            const startResult = normalizeTimeToSession(startTime);
                            const endResult = normalizeTimeToSession(endTime);

                            if (!startResult || !endResult) {
                                errorMessages.push(`Lớp ${groupIndex + 1}: Không thể convert thời gian (chêch lệch > 5 phút)`);
                                return;
                            }

                            startSession = startResult.session;
                            endSession = endResult.session;

                            // Log normalized times if different from input
                            if (startResult.normalizedTime !== startTime || endResult.normalizedTime !== endTime) {
                                console.log(`Lớp ${groupIndex + 1}: Chuẩn hoá từ ${startTime}-${endTime} → ${startResult.normalizedTime}-${endResult.normalizedTime}`);
                            }
                        }
                    } else {
                        errorMessages.push(`Lớp ${groupIndex + 1}: Format tiết không hợp lệ`);
                        return;
                    }
                }

                // Adjust sessions based on time slot
                if (timeSlot === 'C' || timeSlot === 'T') {
                    // Afternoon/Evening: sessions 7-12 (convert from 1-6 to 7-12 if needed)
                    if (startSession <= 6 && endSession <= 6) {
                        startSession += 6;
                        endSession += 6;
                    }
                }

                // Line 3: Weeks
                const weekStr = groupLines[3].trim();
                const weeks = parseWeeks(weekStr);

                // Line 4: Room
                const room = groupLines[4].trim();

                // Get remaining class info (already have courseCode and lastLineParts)
                const subjectName = lastLineParts[2].trim();
                const classType = lastLineParts.length > 3 ? lastLineParts[3].trim() : '';

                // Create subject object
                const subject = {
                    id: Date.now() * 1000 + groupIndex * 100 + Math.floor(Math.random() * 100), // Unique ID
                    name: subjectName,
                    code: courseCode,
                    day: day,
                    startSession: startSession,
                    endSession: endSession,
                    room: room,
                    type: classType,
                    color: getColorForCourse(courseCode),
                    isPE: isPE,
                    weeks: weeks
                };

                parsedSubjects.push(subject);
                successCount++;

            } catch (error) {
                errorMessages.push(`Lớp ${groupIndex + 1}: ${error.message}`);
            }
        });

        // Check for conflicts within parsed subjects and with existing subjects
        let conflictCount = 0;
        const conflictingSubjects = [];

        for (let i = 0; i < parsedSubjects.length; i++) {
            const subject = parsedSubjects[i];
            let hasConflict = false;

            // Check conflict with existing subjects (now considers weeks)
            if (hasScheduleConflict(subject.day, subject.startSession, subject.endSession, null, subject.weeks)) {
                hasConflict = true;
            }

            // Check conflict with other parsed subjects (also considers weeks)
            if (!hasConflict) {
                for (let j = 0; j < i; j++) {
                    const other = parsedSubjects[j];
                    if (other.day === subject.day &&
                        subject.startSession <= other.endSession &&
                        subject.endSession >= other.startSession &&
                        hasWeekOverlap(subject.weeks, other.weeks)) {
                        hasConflict = true;
                        break;
                    }
                }
            }

            if (hasConflict) {
                conflictCount++;
                conflictingSubjects.push(`${subject.name} (${subject.code}) - ${['T' + subject.day]} Tiết ${subject.startSession}-${subject.endSession}`);
            }
        }

        // If there are conflicts, warn user and don't add
        if (conflictCount > 0) {
            alert(`⚠️ Phát hiện ${conflictCount} môn học bị trùng lịch:\n\n${conflictingSubjects.join('\n')}\n\nVui lòng kiểm tra lại dữ liệu và thử lại.`);
            return;
        }

        // Add all parsed subjects to main array
        subjects.push(...parsedSubjects);
        saveToLocalStorage();

        // Render all subjects at once
        if (successCount > 0) {
            renderSchedule();
            document.getElementById('bulkImportText').value = '';

            let message = `✅ Đã thêm ${successCount} lớp học`;
            if (errorMessages.length > 0) {
                message += `\n\n⚠️ Lỗi/Cảnh báo:\n${errorMessages.join('\n')}`;
            }
            alert(message);
        } else {
            alert('❌ Không thêm được lớp nào\n\nLỗi:\n' + errorMessages.join('\n'));
        }

    } catch (error) {
        alert('Lỗi: ' + error.message);
    }
}

// Calculate progress percentage for a subject based on its weeks
function getSubjectProgress(weeks) {
    if (!weeks || weeks.length === 0) return 0;

    const today = new Date();
    const sortedWeeks = [...weeks].sort((a, b) => a - b);
    const firstWeekNum = sortedWeeks[0];
    const lastWeekNum = sortedWeeks[sortedWeeks.length - 1];

    const startDate = academicCalendar[firstWeekNum];
    if (!startDate) return 0;

    const endDate = new Date(academicCalendar[lastWeekNum]);
    endDate.setDate(endDate.getDate() + 7); // End of the last week

    if (today < startDate) return 0;
    if (today > endDate) return 100;

    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;

    return Math.floor((elapsed / totalDuration) * 100);
}

// Format weeks array into compact string like "25-32, 34-42"
function formatWeeksCompact(weeks) {
    if (!weeks || weeks.length === 0) return '—';

    const sorted = [...weeks].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) {
            end = sorted[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = sorted[i];
            end = sorted[i];
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);

    return ranges.join(', ');
}

// Render class list table
function renderClassList() {
    const tbody = document.getElementById('classListBody');
    const emptyDiv = document.getElementById('emptyClassList');
    const tableEl = document.getElementById('classListTable');
    const countSpan = document.getElementById('classCount');
    const searchInput = document.getElementById('classSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const dayNames = { '2': 'Thứ 2', '3': 'Thứ 3', '4': 'Thứ 4', '5': 'Thứ 5', '6': 'Thứ 6', '7': 'Thứ 7' };

    // Filter by search
    let filtered = subjects;
    if (searchTerm) {
        filtered = subjects.filter(s =>
            s.name.toLowerCase().includes(searchTerm) ||
            s.code.toLowerCase().includes(searchTerm) ||
            s.room.toLowerCase().includes(searchTerm)
        );
    }

    // Sort by course code (group same subjects), then by day, then by startSession
    filtered.sort((a, b) => {
        const codeCmp = a.code.localeCompare(b.code);
        if (codeCmp !== 0) return codeCmp;
        const dayDiff = parseInt(a.day) - parseInt(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.startSession - b.startSession;
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tableEl.style.display = 'none';
        emptyDiv.style.display = 'block';
        if (searchTerm) {
            emptyDiv.querySelector('p').textContent = `Không tìm thấy môn học "${searchInput.value}"`;
        } else {
            emptyDiv.querySelector('p').textContent = 'Chưa có lớp học nào. Hãy thêm môn học ở trên!';
        }
    } else {
        tableEl.style.display = '';
        emptyDiv.style.display = 'none';
    }

    countSpan.textContent = subjects.length > 0 ? `${filtered.length}/${subjects.length} lớp` : '';

    // Color map for indicators
    const colorGradients = {
        'color-1': '#667eea',
        'color-2': '#f093fb',
        'color-3': '#4facfe',
        'color-4': '#43e97b',
        'color-5': '#fa709a',
        'color-6': '#30cfd0'
    };

    filtered.forEach((subject, index) => {
        const row = document.createElement('tr');
        const indicatorColor = colorGradients[subject.color] || '#667eea';
        const sessionRange = subject.startSession === subject.endSession
            ? `Tiết ${subject.startSession}`
            : `Tiết ${subject.startSession}-${subject.endSession}`;
        const weeksStr = formatWeeksCompact(subject.weeks);
        const progress = getSubjectProgress(subject.weeks);

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="class-list-name-wrapper">
                    <span class="class-list-color-indicator" style="background: ${indicatorColor}"></span>
                    <span class="class-list-name">${subject.name}</span>
                    ${progress > 0 ? `
                        <div class="class-progress-container">
                            <div class="class-progress-bar" style="width: ${progress}%; background: ${indicatorColor}"></div>
                        </div>
                    ` : ''}
                </div>
            </td>
            <td><span class="class-list-code">${subject.code}</span></td>
            <td><span class="class-list-day">${dayNames[subject.day] || subject.day}</span></td>
            <td><span class="class-list-session">${sessionRange}</span></td>
            <td><span class="class-list-room">${subject.room}</span></td>
            <td>${subject.type ? `<span class="class-list-type">${subject.type}</span>` : '—'}</td>
            <td><span class="class-list-weeks">${weeksStr}</span></td>
            <td><button class="class-list-delete" onclick="deleteSubject(${subject.id})" title="Xóa">🗑️</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Tutorial Modal Functions
function openTutorial() {
    const modal = document.getElementById('tutorialModal');
    modal.style.display = 'block';
    // Pause any other videos and play the tutorial
    const video = modal.querySelector('video');
    video.play();
}

function closeTutorial() {
    const modal = document.getElementById('tutorialModal');
    modal.style.display = 'none';
    // Pause the video when closing
    const video = modal.querySelector('video');
    video.pause();
}

// Close modal when clicking outside of it
window.onclick = function (event) {
    const modal = document.getElementById('tutorialModal');
    if (event.target == modal) {
        closeTutorial();
    }
}

// Initialize
initTheme();
initializeTable();
initWeekSelector();

// Load saved data from localStorage
if (loadFromLocalStorage()) {
    renderSchedule();
    console.log('📚 Đã khôi phục thời khóa biểu từ dữ liệu đã lưu');
}

document.getElementById('scheduleForm').addEventListener('submit', addSubject);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('classSearchInput').addEventListener('input', renderClassList);

// Initial render of class list
renderClassList();