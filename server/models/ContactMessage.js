const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please provide a name'] 
  },
  email: { 
    type: String, 
    required: [true, 'Please provide an email'] 
  },
  phone: { 
    type: String 
  },
  message: { 
    type: String, 
    required: [true, 'Please provide a message'] 
  }
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);