export default class TimeLogging {
    constructor(indexedDB, perentProcId) {
        // indexed DB instance
        this.indexedDB = indexedDB;
        // procParentId is process unique ID string generated in parent process at the loading.
        this.procParentId = perentProcId;
        // intervalId is javascript generate ID for setInterval.
        this.intervalIds = {};
        // daily total times.
        this.daily = {};
        // weekly total times.
        // this.weekly = {};
        this.startOfDay = new Date().setHours(0, 0, 0, 0);
        this.endOfDay = new Date().setHours(23, 59, 59, 999);
        this.table = 'timeLogs';
    }
    // logId used in indexedDB works as primary key.
    getLogId(taskName) {
        return this.intervalIds[taskName] ? `${this.procParentId}${this.intervalIds[taskName]}` : null;
    }
    async tick(taskName) {
        const now = Date.now();
        const db = await this.indexedDB.connect();
        const logId = this.getLogId(taskName);
        const loggedData = await this.indexedDB.get(db, this.table, logId)

        const notifyUpdate = (data) => {
            chrome.runtime.sendMessage({
                requestType: 'updateTimeLog',
                data: data
            });
        };

        if (!loggedData) {
            const data = {
                logId: this.getLogId(taskName),
                taskName: taskName,
                start: now,
                finish: now,
            };
            await this.indexedDB.create(db, this.table, data);
            notifyUpdate(data);
        } else {
            const data = {
                logId: loggedData.logId,
                taskName: loggedData.taskName,
                start: loggedData.start,
                finish: now,
            };
            await this.indexedDB.update(db, this.table, data);
            notifyUpdate(data);
        }
        db.close();
    }
    isLogging(taskName) {
        return !!this.intervalIds[taskName];
    }
    loggingStart(taskName) {
        if (this.intervalIds[taskName]) {
            throw (`logging ID for [${taskName}] already exists`);
        }
        this.intervalIds[taskName] = setInterval(this.tick.bind(this, taskName), 5000);
        this.tick(taskName);
    }
    loggingFinish(taskName) {
        if (!this.intervalIds[taskName]) {
            throw (`no logging ID found for [${taskName}]`);
        }
        clearInterval(this.intervalIds[taskName]);
        this.intervalIds[taskName] = undefined;
    }
    async getTimeLog()  {
        const db = await this.indexedDB.connect();
        const timeLogs = await this.indexedDB.getAll(db, this.table);
        db.close();
        return timeLogs;
    }
    async getLastTimeLog(taskName) {
        const db = await this.indexedDB.connect();
        const timeLogs = await this.indexedDB.getAll(db, this.table, taskName, 'taskName');
        const last = timeLogs.reduce((latest, timeLog) => {
            return latest.start < timeLog.start ? timeLog : latest;
        })
        db.close();
        return last;
    }
    async getDailyTotal(taskName) {
        const db = await this.indexedDB.connect();
        const timeLogs = await this.indexedDB.getAll(db, this.table, taskName, 'taskName');
        const total = timeLogs.reduce((sum, timeLog) => {
            if (timeLog.start < this.startOfDay) {
                return sum + Math.max(0, timeLog.finish - this.startOfDay);
            } else {
                return sum + (timeLog.finish - timeLog.start);
            }
        }, 0)
        db.close();
        return total;
    }
}