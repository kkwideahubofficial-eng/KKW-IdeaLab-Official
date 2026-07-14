import { Room } from '../models/Room.js';

export async function getRooms(req, res) {
  try {
    let query = {};
    const { isSpecial } = req.query;

    if (isSpecial === 'true') {
      query.isSpecial = true;
    } else if (isSpecial === 'false') {
      query.isSpecial = { $ne: true };
    } else {
      query.isSpecial = { $ne: true };
    }

    const rooms = await Room.find(query).sort({ name: 1 });
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: err.message });
  }
}

export async function createRoom(req, res) {
  try {
    const { name, capacity, features, timeSlots, isSpecial, description, image } = req.body;
    const room = new Room({ name, capacity, features, timeSlots, isSpecial, description, image });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    console.error('Error creating room:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A room with this name already exists. Please choose a different name.' });
    }
    res.status(500).json({ message: 'Failed to create room', error: err.message });
  }
}

export async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const { name, capacity, features, isActive, timeSlots, isSpecial, description, image } = req.body;
    console.log(`Updating Room ${id}. Payload:`, { name, capacity, features, isActive, timeSlots, isSpecial, description, image });

    // Explicitly set lastUpdatedDate
    const updateData = { 
        name, capacity, features, isActive, timeSlots, isSpecial, description, image,
        // If activating, clear the reason. If deactivating, reason should be provided in body or handled by caller if passed.
        // Assuming body.deactivationReason is passed.
        deactivationReason: isActive ? null : req.body.deactivationReason,
        lastUpdatedDate: new Date()
    };

    const room = await Room.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    console.log('Updated Room Result:', room);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json(room);
  } catch (err) {
    console.error('Error updating room:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A room with this name already exists. Please choose a different name.' });
    }
    res.status(500).json({ message: 'Failed to update room', error: err.message });
  }
}

export async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    // Hard delete
    const room = await Room.findByIdAndDelete(id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete room', error: err.message });
  }
}
