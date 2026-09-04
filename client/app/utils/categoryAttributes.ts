export interface AttributeField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  unit?: string;
  required?: boolean;
}

export interface SubcategoryConfig {
  name: string;
  attributes?: AttributeField[];
}

export interface CategoryConfig {
  name: string;
  icon?: string;
  subcategories: SubcategoryConfig[];
  defaultAttributes?: AttributeField[];
}

// ── Generic / Default Attribute Sets ──────────────────────────────────────────

const ELECTRONICS_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'brand', label: 'Brand', placeholder: 'e.g. Apple, Samsung, Sony' },
  { key: 'model', label: 'Model', placeholder: 'e.g. Pro Max 2026' },
  { key: 'color', label: 'Color', placeholder: 'e.g. Midnight Black, Titanium' },
  { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. Bluetooth 5.4, Wi-Fi 6, USB-C' },
  { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 1 Year Manufacturer Warranty' },
];

const GROCERY_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'netWeight', label: 'Net Weight', placeholder: 'e.g. 1 kg, 500 g, 200 ml' },
  { key: 'ingredients', label: 'Ingredients', placeholder: 'e.g. 100% Pure Organic Basmati' },
  { key: 'packagingType', label: 'Packaging Type', placeholder: 'e.g. Vacuum Pouch, Glass Jar, Box' },
  { key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g. Farm Fresh Organics' },
  { key: 'countryOfOrigin', label: 'Country of Origin', placeholder: 'e.g. India' },
  { key: 'bestBefore', label: 'Best Before / Shelf Life', placeholder: 'e.g. 12 Months from Packaging' },
  { key: 'storageInstructions', label: 'Storage Instructions', placeholder: 'e.g. Store in a cool, dry place' },
];

const BEAUTY_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'productType', label: 'Product Type', placeholder: 'e.g. Serum, Day Cream, Cleanser' },
  { key: 'skinType', label: 'Skin Type', placeholder: 'e.g. All Skin Types, Oily, Sensitive' },
  { key: 'netQuantity', label: 'Net Quantity', placeholder: 'e.g. 50 ml, 100 g' },
  { key: 'keyIngredients', label: 'Key Ingredients', placeholder: 'e.g. Vitamin C, Hyaluronic Acid' },
  { key: 'benefits', label: 'Benefits', placeholder: 'e.g. Glowing skin, Hydration' },
  { key: 'usage', label: 'Usage / How to Apply', placeholder: 'e.g. Apply morning & evening' },
  { key: 'expiryDate', label: 'Expiry Date / Shelf Life', placeholder: 'e.g. 24 Months' },
];

const TOYS_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'ageGroup', label: 'Age Group', placeholder: 'e.g. 3-6 Years, 6-12 Years, 12+' },
  { key: 'material', label: 'Material', placeholder: 'e.g. Non-toxic ABS Plastic, Solid Wood' },
  { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 25 x 15 x 10 cm' },
  { key: 'color', label: 'Color', placeholder: 'e.g. Multicolor, Red' },
  { key: 'batteryRequired', label: 'Battery Required', placeholder: 'e.g. No, 2x AA required' },
  { key: 'numberOfPieces', label: 'Number of Pieces', placeholder: 'e.g. 150 pcs' },
  { key: 'safetyInformation', label: 'Safety Information', placeholder: 'e.g. Choking hazard for under 3' },
];

const VEGETABLES_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'netWeight', label: 'Net Weight', placeholder: 'e.g. 1 kg, 500 g' },
  { key: 'farmType', label: 'Farm Type', placeholder: 'e.g. 100% Organic, Hydroponic, Farm Fresh' },
  { key: 'freshnessGuaranteed', label: 'Freshness Guaranteed', placeholder: 'e.g. Harvested daily' },
  { key: 'shelfLife', label: 'Shelf Life', placeholder: 'e.g. 3-5 days' },
  { key: 'storageCondition', label: 'Storage Condition', placeholder: 'e.g. Refrigerate after opening' },
];

const FRUITS_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'netWeightCount', label: 'Net Weight / Quantity', placeholder: 'e.g. 1 kg (approx 4-5 pcs)' },
  { key: 'originState', label: 'Origin / Sourcing', placeholder: 'e.g. Shimla, Himachal / Ratnagiri' },
  { key: 'tasteProfile', label: 'Taste Profile', placeholder: 'e.g. Sweet & Crisp, Juicy' },
  { key: 'ripenessStage', label: 'Ripeness Stage', placeholder: 'e.g. Ready to eat / Naturally Ripened' },
  { key: 'storageInstructions', label: 'Storage Instructions', placeholder: 'e.g. Keep at room temperature until ripe' },
];

const HOUSEHOLD_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'material', label: 'Material', placeholder: 'e.g. Stainless Steel 304, Virgin Plastic' },
  { key: 'dimensions', label: 'Dimensions / Size', placeholder: 'e.g. 30 x 20 x 15 cm' },
  { key: 'capacity', label: 'Capacity / Volume', placeholder: 'e.g. 3.5 Litres' },
  { key: 'color', label: 'Color', placeholder: 'e.g. Metallic Silver, Matt Black' },
  { key: 'dishwasherSafe', label: 'Dishwasher Safe', placeholder: 'e.g. Yes / Hand Wash Recommended' },
  { key: 'careInstructions', label: 'Care Instructions', placeholder: 'e.g. Clean with mild soapy water' },
  { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 2 Years Manufacturer Warranty' },
];

const FOOD_BEVERAGES_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'netQuantity', label: 'Net Quantity', placeholder: 'e.g. 250 g, 500 ml' },
  { key: 'foodPreference', label: 'Food Preference', placeholder: 'e.g. 100% Vegetarian, Vegan' },
  { key: 'allergenInfo', label: 'Allergen Info', placeholder: 'e.g. Contains Nuts & Milk' },
  { key: 'shelfLife', label: 'Shelf Life', placeholder: 'e.g. 6 Months' },
  { key: 'calories', label: 'Calories / Nutritional Info', placeholder: 'e.g. 120 kcal per 100g' },
  { key: 'storageInstructions', label: 'Storage Instructions', placeholder: 'e.g. Keep in airtight container' },
];

const FASHION_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'size', label: 'Size', placeholder: 'e.g. S, M, L, XL, XXL / Free Size' },
  { key: 'fabric', label: 'Fabric / Material', placeholder: 'e.g. 100% Pure Cotton, Silk, Denim' },
  { key: 'fitType', label: 'Fit Type', placeholder: 'e.g. Regular Fit, Slim Fit, Oversized' },
  { key: 'pattern', label: 'Pattern', placeholder: 'e.g. Solid, Striped, Printed, Embroidered' },
  { key: 'color', label: 'Color', placeholder: 'e.g. Navy Blue, Olive Green, Black' },
  { key: 'careInstructions', label: 'Wash & Care Instructions', placeholder: 'e.g. Machine wash cold, do not bleach' },
  { key: 'countryOfOrigin', label: 'Country of Origin', placeholder: 'e.g. India' },
];

const PHARMACY_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'dosageForm', label: 'Dosage Form', placeholder: 'e.g. Tablets, Syrup, Capsule, Ointment' },
  { key: 'composition', label: 'Key Composition / Active Ingredient', placeholder: 'e.g. Paracetamol 500mg' },
  { key: 'packagingSize', label: 'Packaging / Pack Size', placeholder: 'e.g. Strip of 10 Tablets, 100ml Bottle' },
  { key: 'prescribedUsage', label: 'Usage / Dosage Advice', placeholder: 'e.g. As directed by Physician' },
  { key: 'expiryDate', label: 'Expiry Date', placeholder: 'e.g. MM/YYYY' },
  { key: 'manufacturer', label: 'Manufacturer / Marketer', placeholder: 'e.g. Cipla, Sun Pharma' },
];

const SPORTS_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'sportType', label: 'Sport / Activity', placeholder: 'e.g. Cricket, Badminton, Gym & Fitness' },
  { key: 'material', label: 'Material', placeholder: 'e.g. English Willow, Carbon Fiber, Cast Iron' },
  { key: 'sizeWeight', label: 'Size / Weight', placeholder: 'e.g. Full Size (Size 6/Short Handle), 5 kg' },
  { key: 'color', label: 'Color', placeholder: 'e.g. Red, Black, Neon Green' },
  { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 6 Months Brand Warranty' },
];

const HOME_LIVING_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'material', label: 'Material', placeholder: 'e.g. Microfiber, Solid Teak Wood, Ceramic' },
  { key: 'dimensions', label: 'Dimensions (L x W x H)', placeholder: 'e.g. 180 x 90 x 75 cm / King Size' },
  { key: 'color', label: 'Color / Finish', placeholder: 'e.g. Walnut Finish, Beige, Charcoal Grey' },
  { key: 'roomType', label: 'Ideal For Room', placeholder: 'e.g. Bedroom, Living Room, Dining' },
  { key: 'careInstructions', label: 'Care Instructions', placeholder: 'e.g. Wipe with damp cloth' },
  { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 1 Year Warranty' },
];

const STATIONERY_DEFAULT_ATTRS: AttributeField[] = [
  { key: 'itemType', label: 'Item Type', placeholder: 'e.g. Spiral Notebook, Gel Pen, Acrylic Color' },
  { key: 'packCount', label: 'Pack Count / Quantity', placeholder: 'e.g. Pack of 5, 200 Pages' },
  { key: 'material', label: 'Paper / Tip Material', placeholder: 'e.g. 80 GSM Acid-free Paper, 0.5mm Tip' },
  { key: 'brand', label: 'Brand', placeholder: 'e.g. Classmate, Camlin, Pilot' },
];

// ── Complete Exhaustive Taxonomy ──────────────────────────────────────────────

export const CATEGORY_TAXONOMY: CategoryConfig[] = [
  {
    name: 'Electronics',
    icon: 'Smartphone',
    defaultAttributes: ELECTRONICS_DEFAULT_ATTRS,
    subcategories: [
      {
        name: 'Mobile Phones',
        attributes: [
          { key: 'model', label: 'Model', placeholder: 'e.g. Galaxy S24 Ultra / iPhone 15 Pro' },
          { key: 'ram', label: 'RAM', placeholder: 'e.g. 8 GB, 12 GB, 16 GB' },
          { key: 'storage', label: 'Storage', placeholder: 'e.g. 128 GB, 256 GB, 512 GB, 1 TB' },
          { key: 'displaySize', label: 'Display Size & Type', placeholder: 'e.g. 6.7 inch Dynamic AMOLED 2X 120Hz' },
          { key: 'processor', label: 'Processor', placeholder: 'e.g. Snapdragon 8 Gen 3 / Apple A17 Pro' },
          { key: 'battery', label: 'Battery Capacity', placeholder: 'e.g. 5000 mAh 45W Fast Charging' },
          { key: 'camera', label: 'Camera Specs', placeholder: 'e.g. 200MP + 50MP + 12MP / 12MP Front' },
          { key: 'color', label: 'Color', placeholder: 'e.g. Titanium Black, Titanium Gray' },
          { key: 'operatingSystem', label: 'Operating System', placeholder: 'e.g. Android 14 / iOS 17' },
          { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 1 Year Manufacturer Warranty' },
        ],
      },
      {
        name: 'Laptops',
        attributes: [
          { key: 'model', label: 'Model', placeholder: 'e.g. MacBook Air M3 / ThinkPad X1 / Dell XPS' },
          { key: 'processor', label: 'Processor', placeholder: 'e.g. Intel Core i7 14th Gen / Apple M3' },
          { key: 'ram', label: 'RAM', placeholder: 'e.g. 16 GB DDR5 5600MHz' },
          { key: 'storage', label: 'Storage', placeholder: 'e.g. 512 GB / 1 TB NVMe SSD' },
          { key: 'graphicsCard', label: 'Graphics Card', placeholder: 'e.g. NVIDIA RTX 4060 8GB / Integrated' },
          { key: 'displaySize', label: 'Display Size & Res', placeholder: 'e.g. 15.6 inch 2.8K OLED 120Hz' },
          { key: 'batteryLife', label: 'Battery Life', placeholder: 'e.g. Up to 18 hours' },
          { key: 'operatingSystem', label: 'Operating System', placeholder: 'e.g. Windows 11 Home / macOS Sonoma' },
          { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 2 Years Onsite Warranty' },
        ],
      },
      {
        name: 'TVs',
        attributes: [
          { key: 'screenSize', label: 'Screen Size', placeholder: 'e.g. 55 inch (139 cm), 65 inch' },
          { key: 'displayTechnology', label: 'Display Technology', placeholder: 'e.g. 4K OLED / QLED / Mini-LED' },
          { key: 'resolution', label: 'Resolution', placeholder: 'e.g. 3840 x 2160 (4K Ultra HD)' },
          { key: 'refreshRate', label: 'Refresh Rate', placeholder: 'e.g. 120 Hz Native / VRR' },
          { key: 'smartTvOs', label: 'Smart TV OS', placeholder: 'e.g. Google TV, LG webOS, Tizen' },
          { key: 'soundOutput', label: 'Sound Output', placeholder: 'e.g. 40W Dolby Atmos Sound' },
          { key: 'hdmiPorts', label: 'HDMI / USB Ports', placeholder: 'e.g. 4x HDMI 2.1, 2x USB' },
          { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 3 Years Comprehensive Warranty' },
        ],
      },
      {
        name: 'Headphones',
        attributes: [
          { key: 'type', label: 'Headphone Type', placeholder: 'e.g. Over-Ear ANC, In-Ear True Wireless (TWS)' },
          { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. Bluetooth 5.4, 3.5mm Jack, Type-C' },
          { key: 'batteryLife', label: 'Battery Life', placeholder: 'e.g. 40 Hours Playtime with ANC' },
          { key: 'noiseCancellation', label: 'Noise Cancellation', placeholder: 'e.g. Hybrid Active Noise Cancelling (ANC)' },
          { key: 'driverSize', label: 'Driver Size', placeholder: 'e.g. 40mm Titanium Drivers' },
          { key: 'microphone', label: 'Microphone Setup', placeholder: 'e.g. 4-Mic Array with AI Environmental Reduction' },
          { key: 'waterResistance', label: 'Water Resistance', placeholder: 'e.g. IPX5 Sweat & Water Resistant' },
          { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 1 Year Replacement Warranty' },
        ],
      },
      { name: 'Smart Watches', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Tablets & iPads', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Cameras', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Audio & Soundbars', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Bluetooth Speakers', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Monitors & Displays', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Desktop PCs & Gaming Rigs', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Printers & Scanners', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'PC Components & Motherboards', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Storage & Hard Drives', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Keyboards & Mice', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Wi-Fi Routers & Networking', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Power Banks & Chargers', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Phone Cases & Screen Guards', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Cables & Adapters', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Gaming Consoles & Controllers', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'CCTV & Smart Security', attributes: ELECTRONICS_DEFAULT_ATTRS },
      { name: 'Accessories', attributes: ELECTRONICS_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Grocery',
    icon: 'ShoppingBag',
    defaultAttributes: GROCERY_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Rice', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Dal & Pulses', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Atta & Flours', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Oils & Ghee', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Spices', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Whole Spices (Khada Masala)', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Salt, Sugar & Jaggery', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Dry Fruits & Nuts', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Healthy Seeds & Superfoods', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Snacks & Namkeen', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Biscuits & Cookies', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Noodles & Pasta', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Breakfast Cereals & Oats', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Ready to Cook & Instant Mixes', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Sauces, Ketchup & Dips', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Pickles (Achar) & Chutneys', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Jams, Honey & Spreads', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Tea & Green Tea', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Coffee & Instant Mixes', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Energy & Health Drinks', attributes: GROCERY_DEFAULT_ATTRS },
      { name: 'Beverages', attributes: GROCERY_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Beauty',
    icon: 'Sparkles',
    defaultAttributes: BEAUTY_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Skin Care', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Hair Care', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Face Wash & Cleansers', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Face Creams & Moisturizers', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Face Serums & Treatments', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Sunscreen & Sun Care', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Face Masks & Scrubs', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Makeup', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Lipsticks & Lip Care', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Eye Makeup & Kajal', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Foundations & Compact', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Fragrances & Perfumes', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Deodorants & Body Mists', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Bath & Body', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Body Lotions & Creams', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: "Men's Grooming", attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Beard Care & Shaving', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Hair Oils & Serums', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Oral Care', attributes: BEAUTY_DEFAULT_ATTRS },
      { name: 'Feminine Hygiene', attributes: BEAUTY_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Toys',
    icon: 'Gamepad2',
    defaultAttributes: TOYS_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Educational Toys', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Building Blocks & LEGO', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Dolls & Dollhouses', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Puzzles & Brain Teasers', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Action Figures & Superheroes', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Board Games & Card Games', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Remote Control Cars & Toys', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Diecast Vehicles & Tracks', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Plush & Soft Toys', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Art, Craft & Clay Kits', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Musical Toys', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Outdoor Play & Ride-Ons', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Baby Walkers & Rockers', attributes: TOYS_DEFAULT_ATTRS },
      { name: 'Baby Care & Diapers', attributes: TOYS_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Vegetables',
    icon: 'Leaf',
    defaultAttributes: VEGETABLES_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Leafy Vegetables (Palak, Methi, Mint)', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Root Vegetables (Carrots, Beetroot, Radish)', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Tomato, Onion & Potato', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Daily Veggies (Brinjal, Bhindi, Cabbage, Gobhi)', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Beans & Peas', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Gourds & Cucumbers', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Exotic & Hydroponic Vegetables', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Fresh Herbs, Ginger, Garlic & Chillies', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Organic Harvests', attributes: VEGETABLES_DEFAULT_ATTRS },
      { name: 'Sprouts & Microgreens', attributes: VEGETABLES_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Fruits',
    icon: 'Apple',
    defaultAttributes: FRUITS_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Apple & Pears', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Banana & Plantains', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Mango & Seasonal Specialties', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Citrus (Oranges, Sweet Lime, Lemon)', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Melons & Watermelon', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Papaya, Pomegranate & Guava', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Grapes & Berries', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Tropical & Exotic Fruits (Kiwi, Avocado, Dragonfruit)', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Seasonal Fruits', attributes: FRUITS_DEFAULT_ATTRS },
      { name: 'Fresh Cut Fruit Bowls', attributes: FRUITS_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Household Items',
    icon: 'Home',
    defaultAttributes: HOUSEHOLD_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Cleaning Detergents & Powders', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Dishwashing Bars & Liquids', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Floor & Bathroom Cleaners', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Mops, Brooms & Cleaning Tools', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Garbage Bags & Bins', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Storage Jars & Airtight Containers', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Cookware (Pans, Kadhai, Cookers)', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Kitchen Utensils & Cutlery', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Tableware & Dinner Sets', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Water Bottles & Flasks', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Home Decor & Lighting', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Kitchen Small Appliances', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Air Fresheners & Incense Agarbatti', attributes: HOUSEHOLD_DEFAULT_ATTRS },
      { name: 'Pest Control & Mosquito Repellents', attributes: HOUSEHOLD_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Food & Beverages',
    icon: 'Utensils',
    defaultAttributes: FOOD_BEVERAGES_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Snacks & Quick Bites', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Bakery Breads & Buns', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Cakes, Pastries & Cookies', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Fresh Milk & Cream', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Paneer, Butter & Cheese', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Sweets & Traditional Mithai', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Ice Creams & Frozen Treats', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Juices & Fresh Cold Pressed Drinks', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Soft Drinks & Sodas', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Restaurant Prepared Food', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Frozen Ready-to-Eat Snacks', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
      { name: 'Eggs & Poultry', attributes: FOOD_BEVERAGES_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Fashion',
    icon: 'Shirt',
    defaultAttributes: FASHION_DEFAULT_ATTRS,
    subcategories: [
      { name: "Men's T-Shirts & Polos", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Men's Formal & Casual Shirts", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Men's Jeans & Trousers", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Men's Ethnic Kurtas & Sets", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Men's Innerwear & Loungewear", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Women's Sarees & Blouses", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Women's Kurtis & Ethnic Suits", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Women's Western Dresses & Tops", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Women's Jeans, Jeggings & Trousers", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Women's Innerwear & Sleepwear", attributes: FASHION_DEFAULT_ATTRS },
      { name: "Kids' Wear (Boys & Girls)", attributes: FASHION_DEFAULT_ATTRS },
      { name: 'Footwear & Shoes', attributes: FASHION_DEFAULT_ATTRS },
      { name: 'Sandals, Slippers & Flip Flops', attributes: FASHION_DEFAULT_ATTRS },
      { name: 'Watches, Belts & Wallets', attributes: FASHION_DEFAULT_ATTRS },
      { name: 'Bags, Backpacks & Luggage', attributes: FASHION_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Pharmacy',
    icon: 'Cross',
    defaultAttributes: PHARMACY_DEFAULT_ATTRS,
    subcategories: [
      { name: 'OTC Medicines & Pain Relief', attributes: PHARMACY_DEFAULT_ATTRS },
      { name: 'First Aid, Bandages & Antiseptics', attributes: PHARMACY_DEFAULT_ATTRS },
      { name: 'Vitamins & Daily Supplements', attributes: PHARMACY_DEFAULT_ATTRS },
      { name: 'Ayurvedic & Herbal Wellness', attributes: PHARMACY_DEFAULT_ATTRS },
      { name: 'Health Monitors (BP, Oximeter, Sugar)', attributes: PHARMACY_DEFAULT_ATTRS },
      { name: 'Protein Supplements & Gym Nutrition', attributes: PHARMACY_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Home & Living',
    icon: 'Bed',
    defaultAttributes: HOME_LIVING_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Bedsheets & Pillow Covers', attributes: HOME_LIVING_DEFAULT_ATTRS },
      { name: 'Blankets, Quilts & Dohars', attributes: HOME_LIVING_DEFAULT_ATTRS },
      { name: 'Bath Towels & Mats', attributes: HOME_LIVING_DEFAULT_ATTRS },
      { name: 'Curtains & Blinds', attributes: HOME_LIVING_DEFAULT_ATTRS },
      { name: 'Carpets & Floor Rugs', attributes: HOME_LIVING_DEFAULT_ATTRS },
      { name: 'Lamps & Ceiling Lighting', attributes: HOME_LIVING_DEFAULT_ATTRS },
      { name: 'Wall Decor, Clocks & Paintings', attributes: HOME_LIVING_DEFAULT_ATTRS },
      { name: 'Home Furniture & Chairs', attributes: HOME_LIVING_DEFAULT_ATTRS },
      { name: 'Storage Organizers & Racks', attributes: HOME_LIVING_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Sports',
    icon: 'Trophy',
    defaultAttributes: SPORTS_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Cricket Equipment', attributes: SPORTS_DEFAULT_ATTRS },
      { name: 'Badminton & Rackets', attributes: SPORTS_DEFAULT_ATTRS },
      { name: 'Football & Sports Balls', attributes: SPORTS_DEFAULT_ATTRS },
      { name: 'Gym & Fitness Dumbbells', attributes: SPORTS_DEFAULT_ATTRS },
      { name: 'Yoga Mats & Accessories', attributes: SPORTS_DEFAULT_ATTRS },
      { name: 'Cycling & Helmets', attributes: SPORTS_DEFAULT_ATTRS },
      { name: 'Camping, Trekking & Tents', attributes: SPORTS_DEFAULT_ATTRS },
      { name: 'Sportswear & Training Gear', attributes: SPORTS_DEFAULT_ATTRS },
    ],
  },
  {
    name: 'Stationery',
    icon: 'PenTool',
    defaultAttributes: STATIONERY_DEFAULT_ATTRS,
    subcategories: [
      { name: 'Notebooks, Registers & Diaries', attributes: STATIONERY_DEFAULT_ATTRS },
      { name: 'Pens, Pencils & Highlighters', attributes: STATIONERY_DEFAULT_ATTRS },
      { name: 'Art, Drawing & Painting Supplies', attributes: STATIONERY_DEFAULT_ATTRS },
      { name: 'Files, Folders & Document Bags', attributes: STATIONERY_DEFAULT_ATTRS },
      { name: 'Desk Accessories, Scissors & Tapes', attributes: STATIONERY_DEFAULT_ATTRS },
      { name: 'Calculators & Office Supplies', attributes: STATIONERY_DEFAULT_ATTRS },
    ],
  },
];

// ── Helper Lookup Functions ───────────────────────────────────────────────────

export function getCategories(): string[] {
  return CATEGORY_TAXONOMY.map(c => c.name);
}

export function getSubcategories(categoryName?: string): string[] {
  if (!categoryName) return [];
  const normalized = categoryName.trim().toLowerCase();
  const cat = CATEGORY_TAXONOMY.find(
    c => c.name.toLowerCase() === normalized ||
      c.name.toLowerCase().includes(normalized) ||
      normalized.includes(c.name.toLowerCase())
  );
  if (!cat) return [];
  return cat.subcategories.map(s => s.name);
}

export function getCategoryAttributes(
  categoryName?: string,
  subcategoryName?: string,
): AttributeField[] {
  if (!categoryName) return [];
  const catNorm = categoryName.trim().toLowerCase();
  const cat = CATEGORY_TAXONOMY.find(
    c => c.name.toLowerCase() === catNorm ||
      c.name.toLowerCase().includes(catNorm) ||
      catNorm.includes(c.name.toLowerCase())
  );
  if (!cat) return [];

  if (subcategoryName) {
    const subNorm = subcategoryName.trim().toLowerCase();
    const sub = cat.subcategories.find(
      s => s.name.toLowerCase() === subNorm ||
        s.name.toLowerCase().includes(subNorm) ||
        subNorm.includes(s.name.toLowerCase())
    );
    if (sub && sub.attributes && sub.attributes.length > 0) {
      return sub.attributes;
    }
  }

  return cat.defaultAttributes || [];
}

/**
 * Normalizes an attributes dictionary + existing specifications array into a clean
 * list of { label: string, value: string } specifications, filtering out empty values.
 */
export function normalizeSpecifications(
  attributes?: Record<string, any> | Map<string, any>,
  existingSpecs?: Array<{ label: string; value: string }>,
  category?: string,
  subcategory?: string,
): Array<{ label: string; value: string }> {
  const result: Array<{ label: string; value: string }> = [];
  const seenLabels = new Set<string>();

  const schema = getCategoryAttributes(category, subcategory);
  const schemaMap = new Map<string, string>();
  schema.forEach(field => {
    schemaMap.set(field.key.toLowerCase(), field.label);
  });

  if (attributes) {
    const entries =
      attributes instanceof Map
        ? Array.from(attributes.entries())
        : Object.entries(attributes);

    for (const [rawKey, rawVal] of entries) {
      if (rawVal === undefined || rawVal === null) continue;
      const strVal = String(rawVal).trim();
      if (!strVal) continue;

      const label =
        schemaMap.get(rawKey.toLowerCase()) ||
        rawKey
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();

      if (!seenLabels.has(label.toLowerCase())) {
        seenLabels.add(label.toLowerCase());
        result.push({ label, value: strVal });
      }
    }
  }

  if (Array.isArray(existingSpecs)) {
    for (const spec of existingSpecs) {
      if (!spec || !spec.label || !spec.value) continue;
      const label = String(spec.label).trim();
      const val = String(spec.value).trim();
      if (!val || val === 'undefined' || val === 'null') continue;

      if (!seenLabels.has(label.toLowerCase())) {
        seenLabels.add(label.toLowerCase());
        result.push({ label, value: val });
      }
    }
  }

  return result;
}
