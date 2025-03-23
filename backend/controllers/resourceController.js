import Resource from '../models/Resource.js';

// Get all resources
export const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ timestamp: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new resource request
export const createResourceRequest = async (req, res) => {
  try {
    const resource = new Resource(req.body);
    const newResource = await resource.save();
    res.status(201).json(newResource);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update resource status
export const updateResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const resource = await Resource.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user's resource requests
export const getUserResourceRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const resources = await Resource.find({ 'providedBy.id': userId }).sort({ timestamp: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 