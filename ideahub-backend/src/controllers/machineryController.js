import Machinery from '../models/Machinery.js';
import mongoose from 'mongoose';

// Get all machinery (Public/Auth)
export const getAllMachinery = async (req, res) => {
  try {
    const userRole = req.user?.role;
    let query = {};

    // If NOT head or admin, only show available machinery
    // Note: User request implied "Active" (visible) vs "Deactive" (hidden).
    // isAvailable usually meant "not booked", but here we are using it as "Active/Visible".
    // If we want to support "Booked but Visible", we might need a separate field, 
    // BUT the prompt explicitly said "Deactive = Hidden". So isAvailable = false => Hidden.
    if (userRole !== 'head' && userRole !== 'admin') {
        query.isAvailable = true;
    }

    const machinery = await Machinery.find(query).sort({ createdAt: -1 });
    res.json(machinery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single machinery details
export const getMachineryById = async (req, res) => {
  try {
    const machinery = await Machinery.findById(req.params.id);
    if (!machinery) {
      return res.status(404).json({ message: 'Machinery not found' });
    }
    // If student tries to access hidden machine via direct link
    if (req.user.role !== 'head' && req.user.role !== 'admin' && !machinery.isAvailable) {
         return res.status(403).json({ message: 'This machinery is currently unavailable' });
    }
    res.json(machinery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create machinery (Head or Coordinator)
export const createMachinery = async (req, res) => {
  try {
    const { name, description, imageUrl, capacity, studentCapacity, timeSlots } = req.body;
    
    const machinery = new Machinery({
      name,
      description,
      imageUrl,
      capacity,
      studentCapacity: studentCapacity !== undefined ? studentCapacity : 1,
      timeSlots, // Expected array of { day, startTime, endTime }
      isAvailable: true, // Default active
      createdBy: req.user._id
    });

    const savedMachinery = await machinery.save();
    res.status(201).json(savedMachinery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update machinery (Head or Coordinator)
export const updateMachinery = async (req, res) => {
  try {
    const { name, description, imageUrl, capacity, studentCapacity, isAvailable, timeSlots } = req.body;
    
    const updateData = {
        name, 
        description, 
        imageUrl, 
        capacity, 
        studentCapacity: studentCapacity !== undefined ? studentCapacity : 1,
        isAvailable, 
        timeSlots,
        lastUpdatedDate: new Date()
    };

    const updatedMachinery = await Machinery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedMachinery) {
      return res.status(404).json({ message: 'Machinery not found' });
    }

    res.json(updatedMachinery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete machinery (Head only)
export const deleteMachinery = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMachinery = await Machinery.findByIdAndDelete(id);

    if (!deletedMachinery) {
      return res.status(404).json({ message: 'Machinery not found' });
    }

    res.status(200).json({ message: 'Machinery deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting machinery', error: error.message });
  }
};
// Get machinery availability/stats for a specific date
export const getMachineryAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ message: 'Date is required' });

    const machinery = await Machinery.findById(id);
    if (!machinery) return res.status(404).json({ message: 'Machinery not found' });

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const requests = await mongoose.model('MachineryRequest').find({
      machineryId: id,
      status: { $ne: 'rejected' },
      usageDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const stats = {};

    requests.forEach(req => {
        const studentCount = req.teamMembers ? req.teamMembers.length : 0;
        const isApproved = req.status === 'approved';
        
        const [startH, startM] = req.startTime.split(':').map(Number);
        const [endH, endM] = req.endTime.split(':').map(Number);
        let currentMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        while (currentMins < endMins) {
            const h = Math.floor(currentMins / 60);
            const m = currentMins % 60;
            const timeKey = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

            if (!stats[timeKey]) {
                stats[timeKey] = { totalApplied: 0, requestsCount: 0, approvedCount: 0 };
            }

            stats[timeKey].totalApplied += studentCount;
            stats[timeKey].requestsCount += 1;
            if (isApproved) {
                stats[timeKey].approvedCount += studentCount;
            }

            currentMins += 15;
        }
    });

    res.status(200).json(stats);

  } catch (error) {
    res.status(500).json({ message: 'Error fetching availability', error: error.message });
  }
};

export const getMachineryRecords = async (req, res) => {
    try {
        const { filter } = req.query;
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        // Calculate start date based on filter
        switch (filter) {
            case 'daily': break; // Today
            case 'weekly': startDate.setDate(startDate.getDate() - 7); break;
            case 'monthly': startDate.setMonth(startDate.getMonth() - 1); break;
            case 'last3months': startDate.setMonth(startDate.getMonth() - 3); break;
            case 'last6months': startDate.setMonth(startDate.getMonth() - 6); break;
            case 'last9months': startDate.setMonth(startDate.getMonth() - 9); break;
            case 'last12months':
            case 'yearly': startDate.setFullYear(startDate.getFullYear() - 1); break;
            default: startDate = new Date(0); // All time
        }

        const requests = await mongoose.model('MachineryRequest').find({
            usageDate: { $gte: startDate }
        })
        .populate('studentId', 'name email teamName')
        .populate('machineryId', 'name')
        .sort({ usageDate: -1, startTime: -1 });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching records', error: error.message });
    }
};

// Update global settings for all machinery
export const updateGlobalMachinerySettings = async (req, res) => {
  try {
    const { capacity, studentCapacity, timeSlots } = req.body;

    const result = await Machinery.updateMany(
      {},
      { 
        $set: { 
          capacity: capacity !== undefined ? capacity : 1, 
          studentCapacity: studentCapacity !== undefined ? studentCapacity : 1,
          timeSlots: timeSlots || [] 
        } 
      }
    );

    res.status(200).json({ 
      message: 'Global settings applied to all machinery successfully',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating global settings', error: error.message });
  }
};
