import Room from '../models/Room.js';

export async function seedSpecialRooms() {
  try {
    const specialRoomsCount = await Room.countDocuments({ isSpecial: true });
    if (specialRoomsCount > 0) {
      console.log(`[Seed] Special rooms already seeded (${specialRoomsCount} found). Skipping.`);
      return;
    }

    console.log('[Seed] Seeding default special rooms...');

    const defaultSpecialRooms = [
      {
        name: "Conference Room",
        capacity: 50,
        features: ["Projector", "Display Screen", "Audio System", "Marker Set", "Whiteboard", "Laptop Connection", "Extension Board", "Internet Access", "Video Conferencing Setup", "Prototype Display Area"],
        description: "Ideal for large presentations, guest lectures, and board meetings. Equipped with high-definition projection, full audio coverage, and video conferencing capabilities.",
        image: "/images/resources/conference_room.png",
        isSpecial: true,
        timeSlots: [],
        isActive: true
      },
      {
        name: "Discussion Room",
        capacity: 15,
        features: ["Display Screen", "Whiteboard", "Marker Set", "Laptop Connection", "Extension Board", "Internet Access"],
        description: "Designed for intensive group brainstorming sessions, project debates, and collaboration. Features whiteboard walls and interactive screen sharing.",
        image: "/images/resources/discussion_room.png",
        isSpecial: true,
        timeSlots: [],
        isActive: true
      },
      {
        name: "Ideation Room",
        capacity: 25,
        features: ["Whiteboard", "Marker Set", "Laptop Connection", "Extension Board", "Internet Access", "Prototype Display Area"],
        description: "A creative room with high-stool seating and movable whiteboards. Designed for team design thinking, rapid prototyping, and active innovation workshops.",
        image: "/images/resources/ideation_room.png",
        isSpecial: true,
        timeSlots: [],
        isActive: true
      }
    ];

    for (const r of defaultSpecialRooms) {
      await Room.findOneAndUpdate(
        { name: r.name, isSpecial: true },
        r,
        { upsert: true, new: true }
      );
    }
    console.log('[Seed] Default special rooms seeded successfully!');
  } catch (error) {
    console.error('[Seed] Error seeding special rooms:', error);
  }
}

export default seedSpecialRooms;
