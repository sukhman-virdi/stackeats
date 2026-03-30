const mongoose = require('mongoose');

// ─── Module: Log Model (Accountability – Part II c) ──────────────────────
const logSchema = new mongoose.Schema({
  timestamp:  { type: Date,   default: Date.now },
  method:     { type: String, enum: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] },
  path:       { type: String },
  query:      { type: mongoose.Schema.Types.Mixed, default: {} },
  statusCode: { type: Number },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: false });

const Log = mongoose.model('Log', logSchema);

const logRequest = async ({ method, path, query, statusCode, userId = null }) => {
  await Log.create({ method, path, query, statusCode, userId });
};

module.exports = Log;
module.exports.logRequest = logRequest;