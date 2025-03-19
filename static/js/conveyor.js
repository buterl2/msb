document.addEventListener('DOMContentLoaded', function() {
    // Register the annotation plugin
    Chart.register(ChartAnnotation);

    // Fetch CDHDR statistics data on page load
    fetchCdhrData();

    // Set up interval to check for new data every 30 seconds
    setInterval(fetchCdhrData, 30000);
});

// Chart instance
let conveyorChart = null;

function fetchCdhrData() {
    // Fetch CDHDR statistics data
    fetch('/api/cdhdr_statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateConveyorChart(data);
            } else {
                console.error('Error loading CDHDR statistics:', data.error);
            }
        })
        .catch(error => {
            console.error('Failed to fetch CDHDR statistics:', error);
        });
}

function updateConveyorChart(data) {
    if (!data || !data.data) {
        console.error('Invalid CDHDR data structure');
        return;
    }

    // If chart already exists, destroy it
    if (conveyorChart) {
        conveyorChart.destroy();
    }
    
    // Get canvas element
    const ctx = document.getElementById('conveyor-chart').getContext('2d');
    
    // Create hourly chart data
    createHourlyChart(ctx, data.data);
}

function createHourlyChart(ctx, cdhrData) {
    // Group data by hour
    const hourlyData = {};
    
    // Process intervals and group by hour
    cdhrData.intervals.forEach(interval => {
        const hour = interval.interval_end.split(':')[0];
        const hourKey = `${hour}:00`;
        
        if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = 0;
        }
        
        hourlyData[hourKey] += interval.box_count;
    });
    
    // Convert to arrays for chart
    const hourLabels = Object.keys(hourlyData).sort();
    const hourlyBoxes = hourLabels.map(hour => hourlyData[hour]);
    
    // Create chart
    conveyorChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [
                {
                    label: 'Boxes per Hour',
                    data: hourlyBoxes,
                    backgroundColor: '#e91e63',     // Red for bars
                    borderColor: '#c2185b',         // Darker red for border
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30, // Added more top padding for the target line annotation
                    right: 20,
                    bottom: 10,
                    left: 20
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hour',
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 16
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Boxes',
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 16
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    beginAtZero: true,
                    suggestedMax: 700, // Added some space above the target line
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Boxes: ${context.raw}`;
                        }
                    },
                    titleFont: {
                        size: 18
                    },
                    bodyFont: {
                        size: 16
                    },
                    padding: 10
                },
                annotation: {
                    annotations: {
                        targetLine: {
                            type: 'line',
                            yMin: 600,
                            yMax: 600,
                            borderColor: '#FFD700', // Gold color for the target line
                            borderWidth: 3,
                            borderDash: [10, 5], // Dashed line
                            label: {
                                enabled: true,
                                content: 'Target: 600',
                                position: 'end',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: '#FFD700',
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}