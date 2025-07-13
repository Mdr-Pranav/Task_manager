// Chart component for task statistics
export function createTaskStatusChart(tasks) {
    const statusCounts = {
        'pending': 0,
        'in-progress': 0,
        'completed': 0
    };

    tasks.forEach(task => {
        statusCounts[task.status]++;
    });

    const ctx = document.getElementById('statusChart');
    if (!ctx) return null;

    // Ensure any existing chart instance is destroyed
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'In Progress', 'Completed'],
            datasets: [{
                data: [
                    statusCounts['pending'],
                    statusCounts['in-progress'],
                    statusCounts['completed']
                ],
                backgroundColor: [
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderColor: [
                    'rgba(251, 191, 36, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
                    }
                }
            }
        }
    });
}

export function createTaskPriorityChart(tasks) {
    const priorityCounts = {
        'low': 0,
        'medium': 0,
        'high': 0
    };

    tasks.forEach(task => {
        priorityCounts[task.priority]++;
    });

    const ctx = document.getElementById('priorityChart');
    if (!ctx) return null;

    // Ensure any existing chart instance is destroyed
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                data: [
                    priorityCounts['low'],
                    priorityCounts['medium'],
                    priorityCounts['high']
                ],
                backgroundColor: [
                    'rgba(147, 197, 253, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgba(147, 197, 253, 1)',
                    'rgba(251, 146, 60, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
                    }
                }
            }
        }
    });
}

export function updateChartTheme(chart) {
    if (!chart) return;

    chart.options.plugins.legend.labels.color = document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151';
    chart.update();
} 