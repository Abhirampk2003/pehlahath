// IndexedDB utility for offline data storage

const DB_NAME = 'pehlahathOfflineDB';
const DB_VERSION = 1;
export const STORES = {
  RESOURCES: 'resources',
  ALERTS: 'alerts',
  EMERGENCY_CONTACTS: 'emergencyContacts',
  USER_DATA: 'userData',
  PENDING_REQUESTS: 'pendingRequests'
};

// Check if IndexedDB is supported
export const checkIndexedDBSupport = () => {
  if (!window.indexedDB) {
    console.error('Your browser doesn\'t support IndexedDB');
    return false;
  }
  return true;
};

// Initialize the database
export const initDB = () => {
  if (!checkIndexedDBSupport()) {
    return Promise.reject('IndexedDB not supported');
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('IndexedDB opened successfully:', db.name, 'v', db.version);
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('Upgrading IndexedDB schema...');
      
      // Create object stores
      if (!db.objectStoreNames.contains(STORES.RESOURCES)) {
        console.log('Creating resources store');
        db.createObjectStore(STORES.RESOURCES, { keyPath: '_id' });
      }
      
      // Rest of your stores...
      if (!db.objectStoreNames.contains(STORES.ALERTS)) {
        db.createObjectStore(STORES.ALERTS, { keyPath: '_id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.EMERGENCY_CONTACTS)) {
        db.createObjectStore(STORES.EMERGENCY_CONTACTS, { keyPath: '_id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.PENDING_REQUESTS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_REQUESTS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('status', 'status', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Generic function to add data to a store
export const addData = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic function to get all data from a store
export const getAllData = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic function to get data by ID
export const getDataById = async (storeName, id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic function to update data
export const updateData = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Generic function to delete data
export const deleteData = async (storeName, id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Add a pending request to be processed when online
export const addPendingRequest = async (request) => {
  return addData(STORES.PENDING_REQUESTS, {
    ...request,
    status: 'pending',
    timestamp: new Date().toISOString()
  });
};

// Get all pending requests
export const getPendingRequests = async () => {
  return getAllData(STORES.PENDING_REQUESTS);
};

// Update a pending request status
export const updatePendingRequestStatus = async (id, status) => {
  const request = await getDataById(STORES.PENDING_REQUESTS, id);
  if (request) {
    request.status = status;
    return updateData(STORES.PENDING_REQUESTS, request);
  }
  return null;
};

// Clear completed requests
export const clearCompletedRequests = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PENDING_REQUESTS, 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_REQUESTS);
    const index = store.index('status');
    const request = index.openCursor(IDBKeyRange.only('completed'));
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    
    request.onerror = () => reject(request.error);
  });
};

export default {
  STORES,
  initDB,
  addData,
  getAllData,
  getDataById,
  updateData,
  deleteData,
  addPendingRequest,
  getPendingRequests,
  updatePendingRequestStatus,
  clearCompletedRequests
};