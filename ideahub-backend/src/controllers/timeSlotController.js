import { TimeSlot } from '../models/TimeSlot.js';

export async function getTimeSlots(req, res) {
  try {
    const slots = await TimeSlot.find({ isActive: true }).sort({ order: 1, startTime: 1 });
    res.status(200).json(slots);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch time slots', error: err.message });
  }
}

export async function createTimeSlot(req, res) {
  try {
    const { label, startTime, endTime, order } = req.body;
    const slot = new TimeSlot({ label, startTime, endTime, order });
    await slot.save();
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create time slot', error: err.message });
  }
}

export async function updateTimeSlot(req, res) {
  try {
    const { id } = req.params;
    const { label, startTime, endTime, isActive, order } = req.body;
    const slot = await TimeSlot.findByIdAndUpdate(
      id,
      { label, startTime, endTime, isActive, order },
      { new: true }
    );
    if (!slot) return res.status(404).json({ message: 'Time slot not found' });
    res.status(200).json(slot);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update time slot', error: err.message });
  }
}

export async function deleteTimeSlot(req, res) {
  try {
    const { id } = req.params;
    const slot = await TimeSlot.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!slot) return res.status(404).json({ message: 'Time slot not found' });
    res.status(200).json({ message: 'Time slot deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete time slot', error: err.message });
  }
}
