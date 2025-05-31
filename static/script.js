document.addEventListener('DOMContentLoaded', function() {
    const timerDisplay = document.getElementById('timer');
    const statusDisplay = document.getElementById('status');
    const timesList = document.getElementById('times-list');
    const showGraphBtn = document.getElementById('show-graph-btn');
    const graphContainer = document.getElementById('graph-container');
    const chartCanvas = document.getElementById('times-chart');
    let chart = null;

    let startTime;
    let elapsedTime = 0;
    let timerInterval;
    let isRunning = false;

    // Format time as MM:SS:mmm
    function formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;

        return (
            (minutes < 10 ? '0' : '') + minutes + ':' +
            (seconds < 10 ? '0' : '') + seconds + ':' +
            (milliseconds < 10 ? '00' : milliseconds < 100 ? '0' : '') + milliseconds
        );
    }

    // Start or stop the timer
    function toggleTimer() {
        if (!isRunning) {
            // Start timer
            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(updateTimer, 10);
            statusDisplay.textContent = 'Press SPACE to stop';
            timerDisplay.classList.add('running');
        } else {
            // Stop timer
            clearInterval(timerInterval);
            saveTime(formatTime(elapsedTime));
            elapsedTime = 0;
            timerDisplay.textContent = '00:00:000';
            statusDisplay.textContent = 'Press SPACE to start';
            timerDisplay.classList.remove('running');
        }

        isRunning = !isRunning;
    }

    // Update the timer display
    function updateTimer() {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(elapsedTime);
    }

    // Save time to server
    function saveTime(timeStr) {
        fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ time: timeStr }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                addTimeToList(timeStr);
            }
        })
        .catch(error => console.error('Error saving time:', error));
    }

    // Add a new time to the list
    function addTimeToList(timeStr) {
        const timeItem = document.createElement('div');
        timeItem.className = 'time-item';

        const timeSpan = document.createElement('span');
        timeSpan.textContent = timeStr;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.dataset.time = timeStr;
        deleteBtn.addEventListener('click', handleDelete);

        timeItem.appendChild(timeSpan);
        timeItem.appendChild(deleteBtn);

        timesList.prepend(timeItem);
    }

    // Handle delete button click
    function handleDelete(e) {
        const timeToDelete = e.target.dataset.time;

        fetch('/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ time: timeToDelete }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Remove the item from the DOM
                const timeItem = e.target.parentElement;
                timeItem.remove();
            }
        })
        .catch(error => console.error('Error deleting time:', error));
    }

    // Add event listener for spacebar
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !e.repeat) {
            e.preventDefault(); // Prevent page scrolling
            toggleTimer();
        }
    });

    // Add event listeners to existing delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });

    if (showGraphBtn) {
        showGraphBtn.addEventListener('click', toggleChart);
    }

    function toggleChart() {
        if (graphContainer.style.display === 'none' || graphContainer.style.display === '') {
            loadChart();
        } else {
            graphContainer.classList.add('hidden');
            setTimeout(() => {
                graphContainer.style.display = 'none';
            }, 500);
        }
    }

    function loadChart() {
        fetch('/times')
            .then(res => res.json())
            .then(times => {
                const parsed = times.map(t => parseTime(t));
                const labels = parsed.map((_, i) => i + 1);
                if (!chart) {
                    chart = new Chart(chartCanvas.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Solve Time (ms)',
                                data: parsed,
                                borderColor: '#3498db',
                                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                                tension: 0.3
                            }]
                        },
                        options: {
                            responsive: true,
                            animation: {
                                duration: 700,
                                easing: 'easeOutQuart'
                            },
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                } else {
                    chart.data.labels = labels;
                    chart.data.datasets[0].data = parsed;
                    chart.update();
                }
                graphContainer.style.display = 'block';
                graphContainer.classList.remove('hidden');
                graphContainer.classList.add('visible');
            });
    }

    function parseTime(str) {
        const [min, sec, ms] = str.split(':');
        return parseInt(min) * 60000 + parseInt(sec) * 1000 + parseInt(ms);
    }
});
