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
            const query = objectStore.get(key);
            query.onsuccess = () => resolve(query.result);
            query.onerror = () => reject(this.getError());
        });
    }
    getAll(db, table, condition = null, index = null) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([table], 'readonly');
            const objectStore = transaction.objectStore(table);
            const query = index ? objectStore.index(index).getAll(condition) : objectStore.getAll(condition);
            query.onsuccess = () => {
                resolve(query.result);
            }
            query.onerror = () => reject(this.getError());
        });
    }
    create(db, table, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([table], 'readwrite');
            const objectStore = transaction.objectStore(table);
            const create = objectStore.add(data);
            create.onsuccess = () => resolve(true);
            create.onerror = () => reject(this.getError());
        });
    }
    update(db, table, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([table], 'readwrite');
            const objectStore = transaction.objectStore(table);
            const update = objectStore.put(data);
            update.onsuccess = () => resolve(true);
            update.onerror = () => reject(this.getError());
        });
    }
}
