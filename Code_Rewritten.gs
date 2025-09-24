function assignSecurityToAreas(securityAssignments, lunchAreas, priorityAreas, outsideIssues) {
    const assignments = {};
    
    // Assign security personnel to lunch areas
    lunchAreas.forEach(area => {
        assignments[area] = securityAssignments.filter(assignment => assignment.isAvailableForLunch(area));
    });
    
    // Handle priority areas
    priorityAreas.forEach(area => {
        if (!assignments[area]) {
            assignments[area] = [];
        }
        assignments[area].push(...securityAssignments.filter(assignment => assignment.isAvailableForPriority(area)));
    });

    // Address Outside (Student Release) issues
    outsideIssues.forEach(issue => {
        const area = issue.area;
        if (!assignments[area]) {
            assignments[area] = [];
        }
        assignments[area].push(...securityAssignments.filter(assignment => assignment.canHandleOutsideIssue(issue)));
    });

    // Return the final assignments
    return assignments;
}