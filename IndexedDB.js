export default class IndexedDB {
    constructor(databaseName, version = 1, migration = () => { }) {
        this.database = databaseName;
        this.version = version;
        this.migration = migration;
    }
    getError(message = null) {
        message = message ?? 'local database error. please reload brouser and app.';
        return new Error(message);
    }
    connect() {
        const promise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.database, this.version);
            request.onsuccess = event => resolve(event.target.result);
            request.onerror = _ => reject(this.getError());
            request.onupgradeneeded = event => this.migration(event.target.result);
        });
        return promise;
    }
    get(db, table, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([table], 'readonly');
            const objectStore = transaction.objectStore(table);
            const request = objectStore.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(this.getError());
        });
    }
    getAll(db, table, condition = null, index = null) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([table], 'readonly');
            const objectStore = transaction.objectStore(table);
            const request = index ? objectStore.index(index).getAll(condition) : objectStore.getAll(condition);
            request.onsuccess = () => {
                resolve(request.result);
            }
            request.onerror = () => reject(this.getError());
        });
    }
    create(db, table, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([table], 'readwrite');
            const objectStore = transaction.objectStore(table);
            const request = objectStore.add(data);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(this.getError());
        });
    }
    update(db, table, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([table], 'readwrite');
            const objectStore = transaction.objectStore(table);
            const request = objectStore.put(data);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(this.getError());
        });
    }
    delete(db, table, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([table], 'readwrite');
            const objectStore = transaction.objectStore(table);
            const request = objectStore.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(this.getError());
        });
    }
}
