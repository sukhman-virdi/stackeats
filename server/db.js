require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

// ─── Singleton Module ─────────────────────────────────────────────────────
// Matches the professor's singleton pattern:
//   getMongoClient(local=true)  → local MongoDB  (MONGO_LOCAL_URI in .env)
//   getMongoClient(false)       → MongoDB Atlas  (MONGO_URI in .env)
const DBModule = (() => {
  let mongoClient = undefined;

  const getMongoClient = (local = true) => {
    const uri = local
      ? (process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/stackeats')
      : process.env.MONGO_URI;

    console.log(`Connection String <<${uri}`);

    if (!mongoClient) {
      mongoClient = mongoose;
    }

    return { uri, client: mongoClient };
  };

  // ── Connect ────────────────────────────────────────────────────────────
  const connectDB = async (local = false) => {
    const { uri } = getMongoClient(local);
    if (!uri) throw new Error('MONGO_URI is not set in server/.env');
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB connected (${local ? 'local' : 'Atlas'})`);
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    }
  };

  // ── Generic CRUD helpers ───────────────────────────────────────────────
  const findAll    = (Model, filter = {}) => Model.find(filter).lean();
  const findOne    = (Model, filter)      => Model.findOne(filter).lean();
  const findById   = (Model, id)          => Model.findById(id).lean();
  const create     = (Model, data)        => Model.create(data);
  const updateById = (Model, id, data)    =>
    Model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  const deleteById = (Model, id)          => Model.findByIdAndDelete(id);

  return { getMongoClient, connectDB, findAll, findOne, findById, create, updateById, deleteById };
})();

module.exports = DBModule;