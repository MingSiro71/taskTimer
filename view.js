class TaskView {
    constructor(taskName) {
        const element = document.createElement('section');
        element.classList.add('task');
        element.setAttribute('data-task-name', taskName);

        const innerHtml = `<p class="task-label">${taskName}</p>
        <div class="task-content">
            <div class="task-content__button">
                <button type="button" class="switch button action-button" style="width: 80px">START</button>
            </div>
            <div class="task-content__logs">
                <div class="log-item" style="width: 8rem">
                    <p class="timer"><span class="log-from">00:00</span> ~ <span class="log-till">00:00</span></p>
                    <p>daily: <span class="log-daily">00:00</span></p>
                </div>
            </div>
        </div>`;
        element.insertAdjacentHTML('afterbegin', innerHtml);
        const actionButton = element.querySelector('.action-button');
        const timer = element.querySelector('.timer');
        const logFrom = element.querySelector('.log-from');
        const logTill = element.querySelector('.log-till');
        const daily = element.querySelector('.log-daily');
        const weekly = element.querySelector('.log-weekly');

        this.taskName = taskName;
        // emulated daily total value 
        this.dailyTotal = 0;
        // html whole element
        this.element = element;
        // action button element
        this.actionButton = actionButton;
        // timer element
        this.timer = timer;
        // log from element
        this.logFrom = logFrom;
        // log till element
        this.logTill = logTill;
        // daily total element
        this.daily = daily;
        // weekly total element
        this.weekly = weekly;
        // activate state
        this.isActive = false;

        this.actionButton.addEventListener('click', (event) => {
            this.onActionButtonClick(event);
        });
        this.onCreate();
    }
    onCreate() {
        this.loadLastLog();
        this.loadDaily();
        // this.getWeekly();
    }
    startLogging() {
        chrome.runtime.sendMessage({
            requestType: 'startLogging',
            data: { taskName: this.taskName }
        });
    }
    finishLogging() {
        chrome.runtime.sendMessage({
            requestType: 'finishLogging',
            data: { taskName: this.taskName }
        }).then((isFinished) => {
            if (isFinished) {
                this.loadLastLog();
                this.loadDaily();
                this.inactivate();
            }
        });
    }
    onActionButtonClick() {
        if (!this.isActive) {
            this.startLogging();
        } else {
            this.finishLogging();
        }
    }
    updateViewFromState() {
        if (this.isActive) {
            if (!this.timer.classList.contains('on-count')) {
                this.timer.classList.add('on-count');
            }
            if (!this.actionButton.classList.contains('active')) {
                this.actionButton.classList.add('active');
            }
        } else {
            if (this.timer.classList.contains('on-count')) {
                this.timer.classList.remove('on-count');
            }
            if (this.actionButton.classList.contains('active')) {
                this.actionButton.classList.remove('active');
            }
        }
    }
    activate() {
        this.isActive = true;
        this.updateViewFromState();
    }
    inactivate() {
        this.isActive = false;
        this.updateViewFromState();
    }
    async isLogging() {
        return await chrome.runtime.sendMessage({
            requestType: 'isLogging',
            data: { taskName: this.taskName }
        });
    }
    renderLoggingTime(start, finish) {
        this.logFrom.innerText = new TimeView(start).time;
        this.logTill.innerText = new TimeView(finish).time;
    }
    async loadLastLog() {
        return await chrome.runtime.sendMessage({
            requestType: 'getLastTimeLog',
            data: { taskName: this.taskName }
        }).then((data) => {
            this.renderLoggingTime(data.start, data.finish);
        })
    }
    renderDaily(dailyTotal) {
        this.daily.innerText = new TimeView(dailyTotal).totalTime;
    }
    async loadDaily() {
        chrome.runtime.sendMessage({
            requestType: 'getDailyTotal',
            data: { taskName: this.taskName }
        }).then((dailyTotal) => {
            this.dailyTotal = dailyTotal;
            this.renderDaily(this.dailyTotal);
        });
    }
    // async getWeekly() {

    // }

}
// taskView stack
const taskViews = {};

class TimeView {
    constructor(timestamp) {
        // time as spend time
        this.totalHour = Math.floor(timestamp / (1000 * 60 * 60));
        this.totalMinute = Math.floor(timestamp / (1000 * 60));
        this.totalTime = `${this.totalHour}:${this.format2Degit(this.totalMinute - this.totalHour * 60)}`;
        // time as datetime
        const datetime = new Date(timestamp);
        this.time = `${this.format2Degit(datetime.getHours())}:${this.format2Degit(datetime.getMinutes())}`
        this.date = `${this.format2Degit(datetime.getMonth())}/${this.format2Degit(datetime.getDate())}`;
        this.fullDate = `${datetime.getFullYear()}/${this.format2Degit(datetime.getMonth())}/${this.format2Degit(datetime.getDate())}`;
    }
    format2Degit(number) {
        return ('00' + number).slice(-2);
    }
}

const timestampToDateString = (timestamp) => {
    const dateObject = new Date(timestamp);
    return `${format2Degit(dateObject.getHours())}:${format2Degit(dateObject.getMinutes())}`;
}

const onDomLoad = (task) => {
    const taskName = task.querySelector('.task-label').innerText;
    initializeTotal(taskName);
}

const setup = () => {
    console.log('onload', Date.now());
    chrome.runtime.sendMessage({ requestType: 'getTask' }).then((tasks) => {
        // stack tasks
        tasks.map((task) => {
            const taskView = new TaskView(task.taskName);
            taskViews[task.taskName] = taskView;
        });
        // render taskViews in main element
        const main = document.body.querySelector('main');
        Object.keys(taskViews).map((taskName) => {
            const taskView = taskViews[taskName];
            main.insertAdjacentElement('beforeend', taskView.element);
            taskView.isLogging().then((isLogging) => {
                if (isLogging) {
                    taskView.activate();
                } else {
                    taskView.loadLastLog();
                }
                taskView.loadDaily();
                // taskView.getWeekly();
            });
        });
    });
};

const reset = () => {

    Object.keys(taskViews).map((taskName) => {
        taskViews[taskName] = undefined;
    });
    const main = document.body.querySelector('main');
    main.innerHTML = null;
    setup();
}

const storeTask = (taskName) => {
    chrome.runtime.sendMessage({
        requestType: 'addTask',
        data: { taskName: taskName }
    }).then((_) => {
        reset();
    });
};

const breakButton = document.querySelector('.break');
breakButton.addEventListener('click', (_) => {
    Object.keys(taskViews).map((taskName) => {
        const taskView = taskViews[taskName];
        taskView.finishLogging();
    });
});

const exportButton = document.querySelector('.export');
exportButton.addEventListener('click', (_) => {
    chrome.runtime.sendMessage({ requestType: 'getTimeLog' })
        .then((logs) => {
            const fileName = 'timeLogs.csv';
            const csv = logs.sort((a, b) => {
                return a.start - b.start;
            }).map((log) => {
                const taskName = log.taskName;
                const start = `${new TimeView(log.start).fullDate} ${new TimeView(log.start).time}`;
                const finish = `${new TimeView(log.finish).fullDate} ${new TimeView(log.finish).time}`;
                const passed = new TimeView(log.finish - log.start).totalTime;
                return [taskName, start, finish, passed];
            }).join('\n');
            const file = new Blob([csv], {type: 'text/csv'})
            const url = (window.URL).createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            window.URL.revokeObjectURL(url);
        });
});

const model = document.getElementById('modal');
const newTaskButton = document.querySelector('.new-task');
const confirmButton = model.querySelector('.confirm-button');
const cancelButton = model.querySelector('.cancel-button');
const input = model.querySelector('input');
confirmButton.addEventListener('click', (_) => {
    const taskName = input.value;
    storeTask(taskName);
    modal.classList.add('hidden');
});

cancelButton.addEventListener('click', () => {
    model.classList.add('hidden');
});

newTaskButton.addEventListener('click', (_) => {
    model.classList.remove('hidden');
});

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    const requestType = message.requestType;
    console.log(requestType);
    switch (requestType) {
        case 'updateTimeLog':
            console.log(message.data);
            const taskView = taskViews[message.data.taskName];
            taskView.activate();
            taskView.renderLoggingTime(message.data.start, message.data.finish);
            taskView.renderDaily(taskView.dailyTotal + (message.data.finish - message.data.start));
            break;
        default:
            break;
    }
    return;
});

window.onload = setup;
