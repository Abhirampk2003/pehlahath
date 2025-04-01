import axios from 'axios';
import { addPendingRequest, getAllData, updateData, STORES, updatePendingRequestStatus, clearCompletedRequests } from '../utils/indexedDB';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`; // Update this with your backend URL

// Check if the device is online
const isOnline = () => navigator.onLine;

axios.interceptors.request.use(request => {
  console.log('Starting API Request:', request.url);
  return request;
});

// Add response interceptor for debugging
axios.interceptors.response.use(response => {
  console.log('API Response:', {
    url: response.config.url,
    status: response.status,
    data: response.data
  });
  return response;
});

export const backendService = {
  // Get all resources
  getAllResources: async () => {
    try {
      if (isOnline()) {
        const response = await axios.get(`${API_BASE_URL}/resources`);
        console.log('Resources from API:', response.data);
        
        // Store the data in IndexedDB for offline use
        const resources = response.data;
        console.log(`Storing ${resources.length} resources in IndexedDB`);
        
        // Clear existing resources first to avoid duplicates
        const existingResources = await getAllData(STORES.RESOURCES);
        console.log(`Found ${existingResources.length} existing resources in IndexedDB`);
        
        // Store each resource individually with proper error handling
        for (const resource of resources) {
          try {
            if (!resource._id) {
              console.warn('Resource missing _id, skipping:', resource);
              continue;
            }
            await updateData(STORES.RESOURCES, resource);
            console.log(`Stored resource: ${resource._id}`);
          } catch (err) {
            console.error(`Failed to store resource ${resource._id}:`, err);
          }
        }
        
        return resources;
      } else {
        // Offline mode - get data from IndexedDB
        console.log('Offline: Getting resources from IndexedDB');
        const offlineResources = await getAllData(STORES.RESOURCES);
        console.log(`Retrieved ${offlineResources.length} resources from IndexedDB`);
        return offlineResources;
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      
      // If network error, try to get data from IndexedDB
      if (!navigator.onLine || error.message.includes('Network Error')) {
        console.log('Network error: Getting resources from IndexedDB');
        return await getAllData(STORES.RESOURCES);
      }
      
      throw error;
    }
  },
  // Create a new resource request
  createResourceRequest: async (resourceData) => {
    try {
      if (isOnline()) {
        const response = await axios.post(`${API_BASE_URL}/resources`, resourceData);
        
        // Store the new resource in IndexedDB
        await updateData(STORES.RESOURCES, response.data);
        
        return response.data;
      } else {
        // Offline mode - store the request for later sync
        console.log('Offline: Storing resource request for later sync');
        const tempId = `temp_${Date.now()}`;
        const tempResource = {
          ...resourceData,
          _id: tempId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          _offline: true
        };
        
        // Store the resource in IndexedDB
        await updateData(STORES.RESOURCES, tempResource);
        
        // Add to pending requests queue
        await addPendingRequest({
          url: `${API_BASE_URL}/resources`,
          method: 'POST',
          data: resourceData,
          resourceId: tempId
        });
        
        return tempResource;
      }
    } catch (error) {
      console.error('Error creating resource request:', error);
      
      // If network error, store for later sync
      if (!navigator.onLine || error.message.includes('Network Error')) {
        console.log('Network error: Storing resource request for later sync');
        const tempId = `temp_${Date.now()}`;
        const tempResource = {
          ...resourceData,
          _id: tempId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          _offline: true
        };
        
        // Store the resource in IndexedDB
        await updateData(STORES.RESOURCES, tempResource);
        
        // Add to pending requests queue
        await addPendingRequest({
          url: `${API_BASE_URL}/resources`,
          method: 'POST',
          data: resourceData,
          resourceId: tempId
        });
        
        return tempResource;
      }
      
      throw error;
    }
  },

  // Update resource status
  updateResourceStatus: async (resourceId, status) => {
    try {
      if (isOnline()) {
        const response = await axios.patch(`${API_BASE_URL}/resources/${resourceId}`, { status });
        
        // Update the resource in IndexedDB
        await updateData(STORES.RESOURCES, response.data);
        
        return response.data;
      } else {
        // Offline mode - store the request for later sync
        console.log('Offline: Storing status update for later sync');
        
        // Get the resource from IndexedDB
        const resources = await getAllData(STORES.RESOURCES);
        const resource = resources.find(r => r._id === resourceId);
        
        if (resource) {
          const updatedResource = { ...resource, status, _modified: true };
          
          // Update the resource in IndexedDB
          await updateData(STORES.RESOURCES, updatedResource);
          
          // Add to pending requests queue
          await addPendingRequest({
            url: `${API_BASE_URL}/resources/${resourceId}`,
            method: 'PATCH',
            data: { status },
            resourceId
          });
          
          return updatedResource;
        }
        
        throw new Error('Resource not found in offline storage');
      }
    } catch (error) {
      console.error('Error updating resource status:', error);
      
      // If network error, store for later sync
      if (!navigator.onLine || error.message.includes('Network Error')) {
        // Get the resource from IndexedDB
        const resources = await getAllData(STORES.RESOURCES);
        const resource = resources.find(r => r._id === resourceId);
        
        if (resource) {
          const updatedResource = { ...resource, status, _modified: true };
          
          // Update the resource in IndexedDB
          await updateData(STORES.RESOURCES, updatedResource);
          
          // Add to pending requests queue
          await addPendingRequest({
            url: `${API_BASE_URL}/resources/${resourceId}`,
            method: 'PATCH',
            data: { status },
            resourceId
          });
          
          return updatedResource;
        }
      }
      
      throw error;
    }
  },

  // Get resources requested by the current user
  getUserRequestedResources: async (userId, token) => {
    try {
      if (isOnline()) {
        const response = await axios.get(`${API_BASE_URL}/resources/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Store the data in IndexedDB for offline use
        const resources = response.data;
        resources.forEach(async (resource) => {
          await updateData(STORES.RESOURCES, resource);
        });
        
        return resources;
      } else {
        // Offline mode - get data from IndexedDB
        console.log('Offline: Getting user resources from IndexedDB');
        const allResources = await getAllData(STORES.RESOURCES);
        return allResources.filter(resource => resource.requestedBy?.id === userId);
      }
    } catch (error) {
      console.error('Error fetching user resources:', error);
      
      // If network error, try to get data from IndexedDB
      if (!navigator.onLine || error.message.includes('Network Error')) {
        console.log('Network error: Getting user resources from IndexedDB');
        const allResources = await getAllData(STORES.RESOURCES);
        return allResources.filter(resource => resource.requestedBy?.id === userId);
      }
      
      throw error;
    }
  },

  // Update resource allocation status
  updateResourceAllocation: async (userId, resourceId, token) => {
    try {
      console.log("resourceId", resourceId);
      console.log("userId", userId);
      
      if (isOnline()) {
        const response = await axios.patch(
          `${API_BASE_URL}/resources/${userId}/${resourceId}/allocate`,
          { status: 'allocated' },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update the resource in IndexedDB
        await updateData(STORES.RESOURCES, response.data);
        
        return response.data;
      } else {
        // Offline mode - store the request for later sync
        console.log('Offline: Storing allocation update for later sync');
        
        // Get the resource from IndexedDB
        const resources = await getAllData(STORES.RESOURCES);
        const resource = resources.find(r => r._id === resourceId);
        
        if (resource) {
          const updatedResource = { ...resource, status: 'allocated', _modified: true };
          
          // Update the resource in IndexedDB
          await updateData(STORES.RESOURCES, updatedResource);
          
          // Add to pending requests queue
          await addPendingRequest({
            url: `${API_BASE_URL}/resources/${userId}/${resourceId}/allocate`,
            method: 'PATCH',
            data: { status: 'allocated' },
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            resourceId
          });
          
          return updatedResource;
        }
        
        throw new Error('Resource not found in offline storage');
      }
    } catch (error) {
      console.error('Error updating resource allocation:', error);
      throw error;
    }
  },

  deleteAllocatedResource: async (userId, resourceId, token) => {
    try {
      if (isOnline()) {
        const response = await axios.delete(
          `${API_BASE_URL}/resources/${userId}/${resourceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Remove from IndexedDB
        // Note: We don't actually delete it, just mark it as deleted for sync purposes
        const resources = await getAllData(STORES.RESOURCES);
        const resource = resources.find(r => r._id === resourceId);
        if (resource) {
          await updateData(STORES.RESOURCES, { ...resource, _deleted: true });
        }
        
        return response.data;
      } else {
        // Offline mode - store the request for later sync
        console.log('Offline: Storing delete request for later sync');
        
        // Get the resource from IndexedDB
        const resources = await getAllData(STORES.RESOURCES);
        const resource = resources.find(r => r._id === resourceId);
        
        if (resource) {
          const updatedResource = { ...resource, _deleted: true, _modified: true };
          
          // Update the resource in IndexedDB
          await updateData(STORES.RESOURCES, updatedResource);
          
          // Add to pending requests queue
          await addPendingRequest({
            url: `${API_BASE_URL}/resources/${userId}/${resourceId}`,
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            resourceId
          });
          
          return { success: true, message: 'Resource marked for deletion when online' };
        }
        
        throw new Error('Resource not found in offline storage');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },
  
  syncPendingRequests: async () => {
    if (!isOnline()) {
      console.log('Cannot sync: Device is offline');
      return { success: false, message: 'Device is offline' };
    }
    
    try {
      const pendingRequests = await getAllData(STORES.PENDING_REQUESTS);
      console.log(`Found ${pendingRequests.length} pending requests to sync`);
      
      for (const request of pendingRequests) {
        try {
          // Process the request
          await axios({
            method: request.method,
            url: request.url,
            data: request.data,
            headers: request.headers || {}
          });
          
          // Mark as completed
          await updatePendingRequestStatus(request.id, 'completed');
          console.log(`Request ${request.id} synced successfully`);
        } catch (error) {
          console.error(`Failed to sync request ${request.id}:`, error);
          await updatePendingRequestStatus(request.id, 'failed');
        }
      }
      
      // Clean up completed requests
      await clearCompletedRequests();
      
      return { success: true, message: 'Sync completed' };
    } catch (error) {
      console.error('Error syncing pending requests:', error);
      return { success: false, message: error.message };
    }
  },

  // Check online status
  isOnline: () => navigator.onLine
};

// Add event listeners for online/offline status
window.addEventListener('online', () => {
  console.log('Device is now online. Attempting to sync...');
  backendService.syncPendingRequests();
});

window.addEventListener('offline', () => {
  console.log('Device is now offline. Data will be stored locally.');
});

// Initialize sync on load if online
if (navigator.onLine) {
  setTimeout(() => {
    backendService.syncPendingRequests();
  }, 3000); // Wait a bit for app to initialize
}