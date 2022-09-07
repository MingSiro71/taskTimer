import { getRandom } from './token.js';
import TimeLogging from './TimeLogging.js';
import IndexedDB from './IndexedDB.js';

// initialize indexed DB
const databaseName = 'timeLogs';
const version = 1;
const migration = (db) => {
    const timeLogStore = db.createObjectStore("timeLogs", { keyPath: "logId" });
    db.createObjectStore("tasks", { keyPath: "taskName" });
    timeLogStore.createIndex("taskName", "taskName", { unique: false });
}
const indexedDB = new IndexedDB(databaseName, version, migration);
// initialize TimeLogging
const timeLogging = new TimeLogging(indexedDB, getRandom(8));

const getTask = async () => {
    // console.log(timeLogging);

    const db = await indexedDB.connect();
    const tasks = await indexedDB.getAll(db, 'tasks');
    db.close();
    return tasks;
}

const addTask = async (data) => {
    const db = await indexedDB.connect();
    const result = await indexedDB.create(db, 'tasks', {
        taskName: data.taskName
    });
    db.close();
    return result;
}

const deleteTask = async (data) => {
    const db = await indexedDB.connect();
    const result = await indexedDB.delete(db, 'tasks', data.taskName);
    db.close();
    return result;
}

const isLogging = async (data) => {
    return timeLogging.isLogging(data.taskName);
}

const startLogging = async (data) => {
    const taskName = data.taskName;
    try {
        timeLogging.loggingStart(taskName);
    } catch (exception) {
        return false;
    }
    return true;
}

const finishLogging = async (data) => {
    const taskName = data.taskName;
    try {
        timeLogging.loggingFinish(taskName);
    } catch (exception) {
        return false;
    }
    return true;
}

const getTimeLog = async () => {
    return await timeLogging.getTimeLog();
}

const getLastTimeLog = async (data) => {
    const taskName = data.taskName;
    return await timeLogging.getLastTimeLog(taskName);
}

const getDailyTotal = async (data) => {
    const taskName = data.taskName;
    return await timeLogging.getDailyTotal(taskName);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const requestType = message.requestType;
    console.log(requestType);
    switch (requestType) {
        case 'getTask':
            getTask().then(sendResponse);
            break;
        case 'addTask':
            addTask(message.data).then(sendResponse);
            break;
        case 'deleteTask':
            deleteTask(message.data).then(sendResponse);
            break;
        case 'isLogging':
            isLogging(message.data).then(sendResponse);
            break;
        case 'startLogging':
            startLogging(message.data).then(sendResponse);
            break;
        case 'finishLogging':
            finishLogging(message.data).then(sendResponse);
            break;
        case 'getTimeLog':
            getTimeLog().then(sendResponse);
            break;
        case 'getLastTimeLog':
            getLastTimeLog(message.data).then(sendResponse);
            break;
        case 'getDailyTotal':
            getDailyTotal(message.data).then(sendResponse);
            break;
        default:
            break;
    }
    return true;
});