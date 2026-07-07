const ContactConfig = require('../models/ContactConfig');
const ContactMessage = require('../models/ContactMessage');

// --- CONFIGURATION LOGIC ---

const getContact = async (req, res) => {
  try {
    const config = await ContactConfig.getConfig();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Fetch config error:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch configuration' });
  }
};

const updateContact = async (req, res) => {
  try {
    let config = await ContactConfig.findOne();
    if (!config) config = new ContactConfig();

    // FIX: Remove immutable fields before Object.assign to prevent MongoDB crash
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    Object.assign(config, updateData);
    await config.save();

    res.status(200).json({ success: true, message: 'Updated successfully', data: config });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not update configuration' });
  }
};

const resetContact = async (req, res) => {
  try {
    const config = await ContactConfig.resetConfig();
    res.status(200).json({ success: true, message: 'Reset successfully', data: config });
  } catch (error) {
    console.error('Reset config error:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not reset configuration' });
  }
};

// --- MESSAGES LOGIC ---

// Public route to submit a new message
const createMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required fields.' });
    }

    const newMessage = await ContactMessage.create({
      name,
      email,
      phone,
      message
    });

    res.status(201).json({ success: true, message: 'Message sent successfully!', data: newMessage });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not save message' });
  }
};

// Protected admin route to get all messages
const getMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch messages' });
  }
};

module.exports = { 
  getContact, 
  updateContact, 
  resetContact, 
  createMessage, 
  getMessages 
};