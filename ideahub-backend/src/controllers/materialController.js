import Material from '../models/Material.js';

// Get all materials (filtered/searched or all)
export const getAllMaterials = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const materials = await Material.find(query).sort({ name: 1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching materials', error: error.message });
  }
};

// Create a new material
export const createMaterial = async (req, res) => {
  try {
    const { name, category, description, currentStock, lowStockThreshold, unit, imageUrl } = req.body;

    const existing = await Material.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Material with this name already exists' });
    }

    const newMaterial = new Material({
      name: name.trim(),
      category,
      description,
      currentStock: Number(currentStock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      unit: unit || 'pcs',
      imageUrl: imageUrl || '',
    });

    const saved = await newMaterial.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error creating material', error: error.message });
  }
};

// Update a material (adjust stock etc.)
export const updateMaterial = async (req, res) => {
  try {
    const { name, category, description, currentStock, allocatedQuantity, lowStockThreshold, unit, imageUrl } = req.body;

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (name) material.name = name.trim();
    if (category) material.category = category;
    if (description !== undefined) material.description = description;
    if (currentStock !== undefined) material.currentStock = Number(currentStock);
    if (allocatedQuantity !== undefined) material.allocatedQuantity = Number(allocatedQuantity);
    if (lowStockThreshold !== undefined) material.lowStockThreshold = Number(lowStockThreshold);
    if (unit) material.unit = unit;
    if (imageUrl !== undefined) material.imageUrl = imageUrl;

    const updated = await material.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating material', error: error.message });
  }
};

// Delete a material
export const deleteMaterial = async (req, res) => {
  try {
    const deleted = await Material.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting material', error: error.message });
  }
};

// Pre-seed default materials for testing and demo purposes
export const seedMaterials = async (req, res) => {
  try {
    const defaultMaterials = [
      {
        name: 'PLA Filament (1kg Roll)',
        category: '3D Printing',
        description: 'Standard 1.75mm PLA Filament for FDM 3D Printers.',
        currentStock: 15,
        lowStockThreshold: 3,
        unit: 'rolls',
        imageUrl: 'https://images.unsplash.com/photo-1615840287214-7fe58a8b668f?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'ABS Filament (1kg Roll)',
        category: '3D Printing',
        description: 'Tough 1.75mm ABS Filament for 3D printing heat-resistant prototypes.',
        currentStock: 8,
        lowStockThreshold: 2,
        unit: 'rolls',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Acrylic Sheet (3mm A4)',
        category: 'Laser Cutting',
        description: 'Clear Acrylic sheet suitable for laser cutter fabrication.',
        currentStock: 40,
        lowStockThreshold: 10,
        unit: 'sheets',
        imageUrl: 'https://images.unsplash.com/photo-1590483736622-39da8a77ffce?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'MDF Wood Board (4mm A4)',
        category: 'Woodwork',
        description: 'Medium-density fibreboard sheets for prototyping structures.',
        currentStock: 50,
        lowStockThreshold: 15,
        unit: 'sheets',
        imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Arduino Uno R3',
        category: 'Electronics',
        description: 'ATmega328P microcontroller board for basic embedded projects.',
        currentStock: 25,
        lowStockThreshold: 5,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1608564697071-ddf911d83785?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'ESP32 Development Board',
        category: 'Electronics',
        description: 'Wi-Fi & Bluetooth integrated microcontroller for IoT applications.',
        currentStock: 20,
        lowStockThreshold: 5,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Copper Clad PCB Board (6x4 inch)',
        category: 'PCB Making',
        description: 'Single-sided copper laminated PCB board for custom chemical engraving.',
        currentStock: 30,
        lowStockThreshold: 8,
        unit: 'pcs',
        imageUrl: 'https://images.unsplash.com/photo-1517055720413-77a28e0e90f8?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Soldering Lead Wire (100g)',
        category: 'Soldering',
        description: 'High-quality 60/40 lead-tin solder wire for electronic assembly.',
        currentStock: 12,
        lowStockThreshold: 3,
        unit: 'spools',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400',
      },
    ];

    let seededCount = 0;
    for (const mat of defaultMaterials) {
      const existing = await Material.findOne({ name: mat.name });
      if (!existing) {
        await Material.create(mat);
        seededCount++;
      }
    }

    res.status(200).json({ message: `Successfully seeded ${seededCount} materials.` });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding materials', error: error.message });
  }
};
