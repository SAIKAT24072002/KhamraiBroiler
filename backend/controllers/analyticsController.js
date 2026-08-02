const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const WholesaleEnquiry = require('../models/WholesaleEnquiry');

/**
 * Compiles dashboard metrics, sales aggregates, and top products.
 * Endpoint: GET /api/admin/analytics
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Core counters
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const readyForPickup = await Order.countDocuments({ status: 'Ready for Pickup' });
    const wholesaleRequests = await WholesaleEnquiry.countDocuments({ status: 'Pending' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    const lowStock = await Product.countDocuments({
      status: 'active',
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    // 2. Today's Revenue
    const todayRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: { $nin: ['Cancelled'] },
          paymentStatus: 'Paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' }
        }
      }
    ]);
    const todaySales = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].totalSales : 0;

    // 3. Lifetime stats
    const lifetimeRevenueAgg = await Order.aggregate([
      {
        $match: {
          status: { $nin: ['Cancelled'] },
          paymentStatus: 'Paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' }
        }
      }
    ]);
    const totalRevenue = lifetimeRevenueAgg.length > 0 ? lifetimeRevenueAgg[0].totalSales : 0;

    // 4. Sales Distribution: Retail vs. Wholesale (calculated based on item rate rules/customer category)
    // For simplicity, we aggregate by checking if item total quantity is wholesale (e.g. ordered items that have wholesale prices applied)
    // Since we track order values, we can split orders. Let's do a simple calculation:
    // Items with unit price equaling the product's wholesale price, or quantities >= minOrder can count as wholesale.
    // For aggregate, we can check item prices. Alternatively, we can calculate based on order types. Let's group items in completed orders.
    const itemsSaleAgg = await Order.aggregate([
      {
        $match: {
          status: { $nin: ['Cancelled'] },
          paymentStatus: 'Paid'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.total' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);

    // 5. Daily Sales Trends (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const salesTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $nin: ['Cancelled'] },
          paymentStatus: 'Paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill empty days in trend
    const trendMap = new Map(salesTrend.map(t => [t._id, t]));
    const formattedTrend = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const val = trendMap.get(dateStr) || { sales: 0, orders: 0 };
      formattedTrend.push({
        date: new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        sales: val.sales,
        orders: val.orders
      });
    }

    res.status(200).json({
      success: true,
      today: {
        sales: todaySales,
        orders: todayOrders,
        pending: pendingOrders,
        ready: readyForPickup,
        wholesale: wholesaleRequests,
        lowStock,
        customers: totalCustomers
      },
      lifetime: {
        totalRevenue
      },
      topProducts: itemsSaleAgg,
      salesTrend: formattedTrend
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics
};
