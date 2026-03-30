// ─── Factory Method Pattern ───────────────────────────────────────────────
// mapperFactory.create(type) returns a mapper object for that data type.
// Each mapper knows how to sanitize and shape its domain data before it
// reaches the controller or gets written to MongoDB.

const MenuItemMapper = {
  type: 'menuItem',
  toDocument(data) {
    return {
      name:        String(data.name).trim(),
      description: String(data.description || '').trim(),
      price:       parseFloat(data.price),
      category:    String(data.category || 'general').trim().toLowerCase(),
      imageUrl:    data.imageUrl || '',
      available:   data.available !== false,
    };
  },
  toResponse(doc) {
    return {
      id:          doc._id,
      name:        doc.name,
      description: doc.description,
      price:       doc.price,
      category:    doc.category,
      imageUrl:    doc.imageUrl,
      available:   doc.available,
    };
  },
};

const OrderMapper = {
  type: 'order',
  toDocument(data) {
    return {
      userId:    data.userId,
      items:     (data.items || []).map(item => ({
        menuItemId: item.menuItemId,
        name:       item.name,
        quantity:   parseInt(item.quantity, 10) || 1,
        price:      parseFloat(item.price),
      })),
      total:     parseFloat(data.total),
      status:    data.status || 'pending',
    };
  },
  toResponse(doc) {
    return {
      id:        doc._id,
      userId:    doc.userId,
      items:     doc.items,
      total:     doc.total,
      status:    doc.status,
      createdAt: doc.createdAt,
    };
  },
};

const UserMapper = {
  type: 'user',
  toDocument(data) {
    return {
      username: String(data.username).trim().toLowerCase(),
      password: data.password,               // hashed before calling mapper
      role:     data.role || 'member',
    };
  },
  toResponse(doc) {
    // Never expose password in a response
    return {
      id:       doc._id,
      username: doc.username,
      role:     doc.role,
    };
  },
};

// ── Factory ────────────────────────────────────────────────────────────────
const mappers = {
  menuItem: MenuItemMapper,
  order:    OrderMapper,
  user:     UserMapper,
};

const mapperFactory = {
  create(type) {
    const mapper = mappers[type];
    if (!mapper) throw new Error(`Unknown mapper type: "${type}"`);
    return mapper;
  },
};

module.exports = mapperFactory;
