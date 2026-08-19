const db = require('../config/database');

// Authentication middleware
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const [users] = await db.execute(
      "SELECT * FROM users WHERE id = ? AND status IN ('approved', 'suspended')",
      [req.session.userId]
    );

    if (users.length === 0) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found or not approved' });
    }

    const user = users[0];
    
    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    req.user = {
      ...user,
      email: req.session.verifiedEmail || user.email,
      first_name: req.session.profile?.firstName || user.first_name,
      last_name: req.session.profile?.lastName || user.last_name,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, async () => {
      const [admins] = await db.execute(
        'SELECT * FROM portal_admins WHERE user_id = ?',
        [req.user.id]
      );
      

      if (admins.length === 0) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.admin = admins[0];
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Admin authentication error' });
  }
};

// Super admin authentication middleware
const requireSuperAdmin = async (req, res, next) => {
  try {
    await requireAdmin(req, res, async () => {
      if (req.admin.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required' });
      }
      next();
    });
  } catch (error) {
    console.error('Super admin auth middleware error:', error);
    res.status(500).json({ error: 'Super admin authentication error' });
  }
};

// Asset access middleware
const requireAssetAccess = async (req, res, next) => {
  try {
    await requireAuth(req, res, async () => {
      const assetId = req.params.assetId || req.body.assetId;
      
      if (!assetId) {
        return res.status(400).json({ error: 'Asset ID required' });
      }

      // Check if user is admin (can access all assets)
      const [admins] = await db.execute(
        'SELECT * FROM portal_admins WHERE user_id = ?',
        [req.user.id]
      );

      if (admins.length > 0) {
        return next();
      }

      // Check if user owns the asset or is a collaborator
      const [assets] = await db.execute(
        `SELECT a.*, ac.role as collaborator_role 
         FROM assets a 
         LEFT JOIN asset_collaborators ac ON a.id = ac.asset_id AND ac.user_id = ? AND ac.status = 'accepted'
         WHERE a.id = ? AND (a.user_id = ? OR ac.user_id = ?)`,
        [req.user.id, assetId, req.user.id, req.user.id]
      );

      if (assets.length === 0) {
        return res.status(403).json({ error: 'Access denied to this asset' });
      }

      req.asset = assets[0];
      req.assetRole = assets[0].collaborator_role || 'owner';
      next();
    });
  } catch (error) {
    console.error('Asset access middleware error:', error);
    res.status(500).json({ error: 'Asset access error' });
  }
};

// Asset owner middleware (only owner can perform certain actions)
const requireAssetOwner = async (req, res, next) => {
  try {
    await requireAssetAccess(req, res, async () => {
      // Admin can perform owner actions
      const [admins] = await db.execute(
        'SELECT * FROM portal_admins WHERE user_id = ?',
        [req.user.id]
      );

      if (admins.length > 0) {
        return next();
      }

      // Check if user is the owner
      if (req.asset.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Asset owner access required' });
      }

      next();
    });
  } catch (error) {
    console.error('Asset owner middleware error:', error);
    res.status(500).json({ error: 'Asset owner access error' });
  }
};

// Log admin activity
const logAdminActivity = async (adminId, action, tableName, recordId, oldValues = null, newValues = null, req) => {
  try {
    await db.execute(
      `INSERT INTO admin_activity_logs 
       (admin_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        action,
        tableName,
        recordId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req.ip,
        req.get('User-Agent')
      ]
    );
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requireAssetAccess,
  requireAssetOwner,
  logAdminActivity
};
