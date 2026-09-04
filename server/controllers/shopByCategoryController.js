const Category = require('../models/Category');
const Product = require('../models/Product');

const PALETTE = [
  { color: 'from-green-400 to-emerald-600',  accent: 'text-green-600',  icon: 'ShoppingBasket' },
  { color: 'from-pink-400 to-rose-600',      accent: 'text-pink-500',   icon: 'Heart' },
  { color: 'from-yellow-400 to-orange-500',  accent: 'text-orange-500', icon: 'Gamepad2' },
  { color: 'from-purple-400 to-indigo-600',  accent: 'text-purple-500', icon: 'Shirt' },
  { color: 'from-teal-400 to-cyan-600',      accent: 'text-teal-600',   icon: 'Home' },
  { color: 'from-blue-400 to-sky-600',       accent: 'text-blue-500',   icon: 'Smartphone' },
  { color: 'from-red-400 to-rose-500',       accent: 'text-red-500',    icon: 'Star' },
  { color: 'from-indigo-400 to-violet-600',  accent: 'text-indigo-500', icon: 'Sparkles' },
];

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// Live, DB-driven — always reflects real Category + Product data. No manual editing.
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 }).lean();

    const productAgg = await Product.aggregate([
      { $match: { category: { $exists: true, $ne: '' }, availability: { $ne: 'Out Of Stock' } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $toLower: '$category' },
          count: { $sum: 1 },
          latestImage: {
            $first: { $ifNull: ['$imageUrl', { $arrayElemAt: ['$images', 0] }] },
          },
        },
      },
    ]);

    const statsByCategory = {};
    for (const stat of productAgg) statsByCategory[stat._id] = stat;

    const data = categories
      .map((cat, i) => {
        const stat = statsByCategory[cat.name.toLowerCase()];
        const count = stat?.count || 0;
        if (count === 0) return null;

        const style = PALETTE[i % PALETTE.length];
        const isNew = Date.now() - new Date(cat.createdAt).getTime() < TWO_WEEKS_MS;

        return {
          id: cat.name,
          title: cat.name,
          img: stat.latestImage || null,
          color: style.color,
          accent: style.accent,
          icon: style.icon,
          count,
          description: `${count} item${count === 1 ? '' : 's'} available`,
          badge: isNew ? 'New' : count >= 20 ? 'Popular' : 'In Stock',
        };
      })
      .filter(Boolean);

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Could not fetch categories',
      error: error.message,
    });
  }
};

module.exports = { getCategories };