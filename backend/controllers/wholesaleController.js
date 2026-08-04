const WholesaleEnquiry = require('../models/WholesaleEnquiry');
const AuditLog = require('../models/AuditLog');

/**
 * Submit a wholesale enquiry.
 * Endpoint: POST /api/wholesale
 */
const submitEnquiry = async (req, res, next) => {
  try {
    const { businessName, contactPerson, mobile, email, items, requiredDate, pickupTime, message } = req.body;

    if (!businessName || !contactPerson || !mobile || !items || !Array.isArray(items) || items.length === 0 || !requiredDate) {
      res.status(400);
      throw new Error('Business name, contact person, mobile, items, and required date are required.');
    }

    const enquiry = await WholesaleEnquiry.create({
      businessName,
      contactPerson,
      mobile,
      email: email || '',
      items,
      requiredDate: new Date(requiredDate),
      pickupTime: pickupTime || '',
      message: message || ''
    });

    // Generate WhatsApp text for client redirect
    const itemsText = items.map(item => `- ${item.productName}: ${item.quantity} ${item.unit || 'KG'}`).join('%0A');
    const formattedDate = new Date(requiredDate).toLocaleDateString('en-IN');
    const whatsappText = `Hello KHAMRAI BROILER CENTER,%0A%0AI would like to submit a Wholesale Enquiry:%0A%0A` +
      `*Business:* ${businessName}%0A` +
      `*Contact Person:* ${contactPerson}%0A` +
      `*Mobile:* ${mobile}%0A` +
      `*Required Date:* ${formattedDate} (${pickupTime || 'N/A'})%0A%0A` +
      `*Products:*%0A${itemsText}%0A%0A` +
      `*Note/Message:* ${message || 'None'}`;

    // Emit real-time notification to Admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_wholesale_lead', {
        enquiryId: enquiry._id,
        businessName: enquiry.businessName,
        contactPerson: enquiry.contactPerson,
        createdAt: enquiry.createdAt
      });
    }

    res.status(201).json({
      success: true,
      enquiry,
      whatsappUrl: `https://wa.me/?text=${whatsappText}`, // Frontend can override with admin phone
      whatsappText
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all wholesale enquiries. (Admin/Manager/Sales)
 * Endpoint: GET /api/wholesale
 */
const getEnquiries = async (req, res, next) => {
  try {
    const enquiries = await WholesaleEnquiry.find().sort({ createdAt: -1 });
    res.status(200).json(enquiries);
  } catch (error) {
    next(error);
  }
};

/**
 * Update enquiry status. (Admin/Manager/Sales)
 * Endpoint: PUT /api/wholesale/:id/status
 */
const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400);
      throw new Error('Status is required.');
    }

    const enquiry = await WholesaleEnquiry.findById(req.params.id);
    if (!enquiry) {
      res.status(404);
      throw new Error('Enquiry not found.');
    }

    const oldStatus = enquiry.status;
    enquiry.status = status;
    await enquiry.save();

    await AuditLog.create({
      action: 'WHOLESALE_STATUS_CHANGED',
      performedBy: req.user._id,
      details: `Changed wholesale enquiry for '${enquiry.businessName}' from '${oldStatus}' to '${status}'`,
      targetId: enquiry._id,
      targetModel: 'WholesaleEnquiry'
    });

    // Emit real-time update to Admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('admin_wholesale_updated', {
        enquiryId: enquiry._id,
        status: enquiry.status,
        updatedAt: new Date()
      });
    }

    res.status(200).json(enquiry);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitEnquiry,
  getEnquiries,
  updateEnquiryStatus
};
