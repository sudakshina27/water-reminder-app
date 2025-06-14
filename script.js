// Water Reminder App JavaScript

class WaterReminder {
    constructor() {
        this.isActive = false;
        this.reminderInterval = null;
        this.countdownInterval = null;
        this.waterCount = 0;
        this.startTime = 8; // 8 AM
        this.endTime = 20; // 8 PM
        this.reminderGapMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

        this.initializeElements();
        this.loadWaterCount();
        this.setupEventListeners();
        this.checkNotificationPermission();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusText = document.getElementById('statusText');
        this.waterCountDisplay = document.getElementById('waterCount');
        this.drankBtn = document.getElementById('drankBtn');
        const testBtn = document.getElementById('testNotificationBtn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testNotification());
        }

        this.stopBtn.disabled = true;
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startReminders());
        this.stopBtn.addEventListener('click', () => this.stopReminders());
        this.drankBtn.addEventListener('click', () => this.incrementWaterCount());
    }

    async checkNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        this.showNotification('Great!', 'Water reminders are now enabled! 💧');
                    } else {
                        alert('Notifications were not enabled. You can still use the app, but you won\'t get browser notifications.');
                    }
                } catch (error) {
                    console.error('Error requesting permission:', error);
                }
            } else if (Notification.permission === 'granted') {
                this.showNotification('Welcome back!', 'Water reminders are ready! 💧');
            } else {
                alert('Notifications are disabled. You can enable them in your browser settings if you want notification alerts.');
            }
        } else {
            alert('Your browser doesn\'t support notifications. You can still use the app manually!');
        }
    }

    isWithinReminderHours() {
        const now = new Date();
        const currentHour = now.getHours();
        return currentHour >= this.startTime && currentHour < this.endTime;
    }

    startReminders() {
        if (this.isActive) return;

        this.isActive = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;

        this.updateStatus('Water reminders are active! (8 AM - 8 PM)');

        if (this.isWithinReminderHours()) {
            const lastReminderTime = this.getLastReminderTime();
            const now = Date.now();
            const timeSinceLast = now - lastReminderTime;

            if (timeSinceLast >= this.reminderGapMs) {
                this.sendReminder();
            } else {
                this.startCountdown(this.reminderGapMs - timeSinceLast);
            }
        }

        this.reminderInterval = setInterval(() => {
            this.checkAndSendReminder();
        }, 1000);
    }

    stopReminders() {
        if (!this.isActive) return;

        this.isActive = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;

        clearInterval(this.reminderInterval);
        this.reminderInterval = null;

        clearInterval(this.countdownInterval);
        this.countdownInterval = null;

        this.updateStatus('Water reminders are stopped. Click "Start Reminders" to begin.');
        this.showNotification('Water Reminders Stopped', 'Reminders have been disabled.');
    }

    checkAndSendReminder() {
        if (!this.isActive) return;

        const now = new Date();
        const lastReminderTime = this.getLastReminderTime();
        const timeSinceLast = now.getTime() - lastReminderTime;

        if (this.isWithinReminderHours() && timeSinceLast >= this.reminderGapMs) {
            this.sendReminder();
        }
    }

    sendReminder() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.showNotification('💧 Time to Drink Water!', `It's ${timeString} - Don't forget to stay hydrated!`);
        this.updateStatus(`💧 Reminder sent at ${timeString}! Time to drink water!`);

        setTimeout(() => {
            if (this.isActive) {
                this.updateStatus('Water reminders are active! (8 AM - 8 PM)');
            }
        }, 5000);

        localStorage.setItem('lastReminder', Date.now().toString());
        this.startCountdown(this.reminderGapMs);
    }

    startCountdown(durationMs) {
        clearInterval(this.countdownInterval);

        let remaining = durationMs;

        this.countdownInterval = setInterval(() => {
            if (!this.isActive) return;

            if (!this.isWithinReminderHours()) {
                this.updateStatus('Outside reminder hours (8 AM - 8 PM). Reminders paused.');
                clearInterval(this.countdownInterval);
                return;
            }

            if (remaining <= 0) {
                clearInterval(this.countdownInterval);
                return;
            }

            const hrs = Math.floor(remaining / 3600000);
            const mins = Math.floor((remaining % 3600000) / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);

            const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            this.updateStatus(`Next water reminder in ${timeStr}`);

            remaining -= 1000;
        }, 1000);
    }

    getLastReminderTime() {
        const saved = localStorage.getItem('lastReminder');
        return saved ? parseInt(saved) : 0;
    }

    testNotification() {
        if (Notification.permission === 'granted') {
            this.showNotification('Test Notification', 'This is a test! Your notifications are working! 🎉');
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showNotification('Test Notification', 'Permission granted! Notifications are now working! 🎉');
                }
            });
        } else {
            alert('Notifications are blocked. Please enable them in your browser settings.');
        }
    }

    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body: body,
                    icon: '',
                    requireInteraction: false,
                    silent: false,
                    tag: 'water-reminder'
                });

                notification.onclick = function () {
                    window.focus();
                    notification.close();
                };

                setTimeout(() => {
                    try {
                        notification.close();
                    } catch (e) {}
                }, 5000);

            } catch (error) {
                alert(`${title}: ${body}`);
            }
        } else {
            alert(`${title}: ${body}`);
        }
    }

    updateStatus(message) {
        this.statusText.textContent = message;
    }

    incrementWaterCount() {
        this.waterCount++;
        this.waterCountDisplay.textContent = this.waterCount;
        this.saveWaterCount();

        const encouragements = [
            'Great job! Keep it up! 💧',
            'Excellent! You\'re staying hydrated! 🌟',
            'Way to go! Your body thanks you! 💪',
            'Perfect! Keep drinking water! ⭐',
            'Amazing! You\'re doing great! 🎉'
        ];

        const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
        this.showNotification('Water Logged!', randomEncouragement);
    }

    saveWaterCount() {
        const today = new Date().toDateString();
        const waterData = {
            date: today,
            count: this.waterCount
        };
        localStorage.setItem('waterReminder_data', JSON.stringify(waterData));
    }

    loadWaterCount() {
        const saved = localStorage.getItem('waterReminder_data');
        if (saved) {
            const waterData = JSON.parse(saved);
            const today = new Date().toDateString();

            if (waterData.date === today) {
                this.waterCount = waterData.count;
            } else {
                this.waterCount = 0;
                this.saveWaterCount();
            }
        } else {
            this.waterCount = 0;
        }

        this.waterCountDisplay.textContent = this.waterCount;
    }

    getStatus() {
        return {
            isActive: this.isActive,
            waterCount: this.waterCount,
            currentTime: new Date().toLocaleTimeString(),
            isWithinHours: this.isWithinReminderHours()
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const waterReminder = new WaterReminder();
    window.waterReminder = waterReminder;
});
