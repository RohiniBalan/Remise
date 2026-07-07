const ContactConfig = require('../models/ContactConfig');
const ContactMessage = require('../models/ContactMessage');

const getContact = async (req, res) => {
  try {
    res.json({ success: true, data: await ContactConfig.getConfig() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateContact = async (req, res) => {
  try {
    let config = await ContactConfig.findOne();
    if (config) { Object.assign(config, req.body); await config.save(); }
    else config = await ContactConfig.create(req.body);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetContact = async (req, res) => {
  try {
    await ContactConfig.deleteMany({});
    res.json({ success: true, data: await ContactConfig.getConfig() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'name, email, and message are required' });
    const msg = await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({ success: true, message: 'Message sent successfully', data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getContact, updateContact, resetContact, createMessage, getMessages };
