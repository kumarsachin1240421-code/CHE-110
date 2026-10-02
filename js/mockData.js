/**
 * EcoScan AI - Content, Waste Classification Database & Eco-Facts
 * Note: ZERO fake/mock reviews. Reviews are 100% user-generated via localStorage.
 */

// Waste Item Presets for Vision Scanner & Simulator
export const WASTE_ITEMS_DATABASE = [
  {
    id: "plastic-bottle",
    name: "Clear PET Plastic Bottle",
    category: "Non-Biodegradable",
    binType: "Blue Bin",
    binClass: "bin-blue",
    binIcon: "🗑️",
    binColorName: "Blue Bin (Dry / Recyclable Waste)",
    material: "Type 1 PET Plastic",
    image: "./assets/images/plastic_bottle.jpg",
    instructions: "Empty all liquid, give it a quick rinse, crush the bottle flat to conserve collection volume, and place it in the dry recyclables bin.",
    biodegradable: false
  },
  {
    id: "banana-peel",
    name: "Organic Banana Peel",
    category: "Biodegradable",
    binType: "Green Bin",
    binClass: "bin-green",
    binIcon: "🌱",
    binColorName: "Green Bin (Wet / Organic Waste)",
    material: "100% Organic Biomass",
    image: "./assets/images/banana_peel.jpg",
    instructions: "Deposit directly into the green wet-waste bin or your home composting unit. Decomposes naturally into rich compost within 2-4 weeks.",
    biodegradable: true
  },
  {
    id: "soda-can",
    name: "Aluminum Beverage Can",
    category: "Non-Biodegradable",
    binType: "Blue Bin",
    binClass: "bin-blue",
    binIcon: "🥫",
    binColorName: "Blue Bin (Dry / Metal Recyclable)",
    material: "100% Infinitely Recyclable Aluminum",
    image: "./assets/images/soda_can.jpg",
    instructions: "Rinse away sugary residue, ensure the tab stays attached, crush if possible, and put in the dry recyclables bin.",
    biodegradable: false
  },
  {
    id: "cardboard-box",
    name: "Corrugated Cardboard Packaging",
    category: "Biodegradable",
    binType: "Blue Bin",
    binClass: "bin-blue",
    binIcon: "📦",
    binColorName: "Blue Bin (Dry Paper & Cardboard)",
    material: "Recycled Wood Pulp & Paper Fiber",
    image: "./assets/images/cardboard_box.jpg",
    instructions: "Remove shipping tape and plastic stickers, flatten the box completely to save space, and place into the dry paper bin.",
    biodegradable: true
  },
  {
    id: "coffee-cup",
    name: "Single-Use Paper Beverage Cup",
    category: "Non-Biodegradable",
    binType: "Blue Bin",
    binClass: "bin-blue",
    binIcon: "☕",
    binColorName: "Blue Bin (Dry / Mixed Packaging)",
    material: "Paper with Polyethylene (LDPE) Waterproof Lining",
    image: "./assets/images/plastic_bottle.jpg",
    instructions: "Empty any lingering liquid. Because takeaway paper cups contain an inner plastic coating, segregate plastic lids separately.",
    biodegradable: false
  },
  {
    id: "apple-core",
    name: "Fresh Fruit & Vegetable Scraps",
    category: "Biodegradable",
    binType: "Green Bin",
    binClass: "bin-green",
    binIcon: "🍎",
    binColorName: "Green Bin (Wet / Compostable Waste)",
    material: "Organic Kitchen Waste",
    image: "./assets/images/banana_peel.jpg",
    instructions: "Toss into the green bin for municipal biogas generation or kitchen aerobic composting.",
    biodegradable: true
  }
];

// Engaging, Real-World Eco-Facts & Daily Cleanliness Advice
export const ECO_FACTS_DATABASE = [
  {
    id: "fact-1",
    tag: "Circular Economy",
    title: "The 450-Year Plastic Timeline",
    text: "A single PET plastic bottle takes between 450 to 500 years to decompose in nature. In sunlight, it fragments into microscopic particles (microplastics) that contaminate water and soil. Segregating into the Blue Bin ensures it is mechanically shredded into fresh polyester fibers instead!",
    icon: "🧴"
  },
  {
    id: "fact-2",
    tag: "Landfill Science",
    title: "Why Wet Waste Must Stay Green",
    text: "When organic wet waste (vegetable peels, leftover food) is dumped into landfills mixed with plastics, it gets buried without oxygen (anaerobic state), creating methane—a greenhouse gas 28x more potent than carbon dioxide. Segregating wet waste into the Green Bin allows clean composting into fertilizer.",
    icon: "🌱"
  },
  {
    id: "fact-3",
    tag: "Clean Habits",
    title: "The Milk Pouch Corner Trick",
    text: "When opening a milk or oil packet, make a small horizontal cut without fully severing the small corner tip. Small detached plastic triangles slip through municipal sorting sieves and wash into rivers. Keeping the corner attached allows the entire pouch to be recycled together!",
    icon: "✂️"
  },
  {
    id: "fact-4",
    tag: "Material Miracle",
    title: "The Infinite Life of Aluminum",
    text: "Aluminum is 100% and infinitely recyclable without losing its structural properties. In fact, nearly 75% of all aluminum ever produced in human history is still in productive use today! Recycling one soda can saves enough electricity to run a TV for 3 hours.",
    icon: "⚡"
  },
  {
    id: "fact-5",
    tag: "Urban Cleanliness",
    title: "The 10-Second Container Rinse",
    text: "Recyclables do not need to be dishwashed with soap, but a quick 10-second water swirl to remove oil and sugar residues stops foul odors and prevents entire truckloads of dry cardboard from being contaminated and sent to the incinerator.",
    icon: "💧"
  },
  {
    id: "fact-6",
    tag: "Zero-Waste Home",
    title: "Turning Waste into Black Gold",
    text: "Over 50% of typical household waste is organic and compostable. Composting fruit peels, egg shells, and used coffee grounds at home produces nutrient-rich organic fertilizer that naturally restores topsoil vitality and eliminates the need for chemical fertilizers.",
    icon: "🪴"
  }
];
