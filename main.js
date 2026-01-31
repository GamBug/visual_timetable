const subjects = [];
const colorClasses = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6'];
let colorCounter = 0;
const courseColorMap = {}; // Map courseCode to color for consistent coloring

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
        toggle.textContent = isDarkMode ? '☀️' : '🌙';
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

function hasScheduleConflict(day, startSession, endSession, excludeId = null) {
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
        const overlap = startSession <= subject.endSession && endSession >= subject.startSession;
        return overlap;
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

    // Render subjects
    subjects.forEach(subject => {
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
                isPE: isPE
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

                // Line 3: Weeks (skip)
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
                    isPE: isPE
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
            
            // Check conflict with existing subjects
            if (hasScheduleConflict(subject.day, subject.startSession, subject.endSession)) {
                hasConflict = true;
            }
            
            // Check conflict with other parsed subjects
            if (!hasConflict) {
                for (let j = 0; j < i; j++) {
                    const other = parsedSubjects[j];
                    if (other.day === subject.day && 
                        subject.startSession <= other.endSession && 
                        subject.endSession >= other.startSession) {
                        hasConflict = true;
                        break;
                    }
                }
            }
            
            if (hasConflict) {
                conflictCount++;
                conflictingSubjects.push(`${subject.name} (${subject.code}) - ${['T'+subject.day]} Tiết ${subject.startSession}-${subject.endSession}`);
            }
        }
        
        // If there are conflicts, warn user and don't add
        if (conflictCount > 0) {
            alert(`⚠️ Phát hiện ${conflictCount} môn học bị trùng lịch:\n\n${conflictingSubjects.join('\n')}\n\nVui lòng kiểm tra lại dữ liệu và thử lại.`);
            return;
        }

        // Add all parsed subjects to main array
        subjects.push(...parsedSubjects);

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
window.onclick = function(event) {
    const modal = document.getElementById('tutorialModal');
    if (event.target == modal) {
        closeTutorial();
    }
}

// Initialize
initTheme();
initializeTable();
document.getElementById('scheduleForm').addEventListener('submit', addSubject);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);