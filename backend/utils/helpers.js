/**
 * Escape special regex characters in a string to prevent ReDoS attacks.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for use in RegExp
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validate and calculate expense splits based on split type.
 * @param {number} totalAmount - The total expense amount
 * @param {string} splitType - 'equal', 'percentage', or 'unequal'
 * @param {Array} splits - Array of split objects with user, amount, percentage
 * @returns {Array} Calculated splits with amounts and percentages
 */
const calculateSplits = (totalAmount, splitType, splits) => {
  if (splitType === 'equal') {
    const amountPerPerson = totalAmount / splits.length;
    return splits.map(split => ({
      user: split.user,
      amount: parseFloat(amountPerPerson.toFixed(2)),
      percentage: parseFloat((100 / splits.length).toFixed(2))
    }));
  } else if (splitType === 'percentage') {
    return splits.map(split => ({
      user: split.user,
      amount: parseFloat((totalAmount * split.percentage / 100).toFixed(2)),
      percentage: split.percentage
    }));
  } else if (splitType === 'unequal') {
    return splits.map(split => ({
      user: split.user,
      amount: split.amount,
      percentage: parseFloat((split.amount / totalAmount * 100).toFixed(2))
    }));
  }
  return splits;
};

/**
 * Validate that paidBy and split users exist and are not admins.
 * @param {string} paidBy - The ID of the user who paid
 * @param {Array} splits - Array of split objects with user IDs
 * @param {Object} User - The Mongoose User model
 * @returns {Object} { valid: boolean, error: string|null }
 */
const validateExpenseUsers = async (paidBy, splits, User) => {
  const paidByUser = await User.findById(paidBy);
  if (!paidByUser) {
    return { valid: false, error: 'Invalid paidBy user' };
  }
  if (paidByUser.isAdmin) {
    return { valid: false, error: 'Admin users cannot be added to expenses' };
  }

  const splitUserIds = splits.map(s => s.user);
  const splitUsers = await User.find({ _id: { $in: splitUserIds } });

  if (splitUsers.length !== splitUserIds.length) {
    return { valid: false, error: 'Invalid user in splits' };
  }

  if (splitUsers.some(u => u.isAdmin)) {
    return { valid: false, error: 'Admin users cannot be added to expenses' };
  }

  return { valid: true, error: null };
};

/**
 * Resolve group members from email list, returning found members, not-found emails, and member IDs.
 * @param {Array} memberEmails - Array of email addresses
 * @param {string} creatorId - The ID of the group creator
 * @param {Object} User - The Mongoose User model
 * @returns {Object} { memberIds, notFoundEmails }
 */
const resolveGroupMembers = async (memberEmails, creatorId, User) => {
  const members = await User.find({
    email: { $in: memberEmails },
    isAdmin: { $ne: true }
  }).select('_id email');

  const foundEmails = members.map(m => m.email);
  const notFoundEmails = memberEmails.filter(email => !foundEmails.includes(email));

  const memberIds = members.map(m => m._id.toString());
  if (!memberIds.includes(creatorId.toString())) {
    memberIds.push(creatorId);
  }

  return { memberIds, notFoundEmails };
};

/**
 * Store pending group invitations for users who haven't signed up yet.
 * @param {Array} emails - Array of email addresses to invite
 * @param {string} groupId - The group ID
 * @param {string} invitedById - The ID of the user sending the invite
 * @param {Object} PendingGroupInvite - The Mongoose PendingGroupInvite model
 */
const storePendingInvites = async (emails, groupId, invitedById, PendingGroupInvite) => {
  if (emails.length === 0) return;

  const pendingInvites = emails.map(email => ({
    email,
    group: groupId,
    invitedBy: invitedById,
  }));

  await PendingGroupInvite.insertMany(pendingInvites, { ordered: false }).catch(err => {
    if (err.code !== 11000) throw err;
  });
};

/**
 * Expand a recurring income entry into individual occurrences within a date range.
 * @param {Object} income - The recurring income document (plain object or Mongoose doc)
 * @param {Date} rangeStart - Start of the query date range
 * @param {Date} rangeEnd - End of the query date range
 * @returns {Array} Array of virtual income instances with computed dates
 */
const expandRecurringIncome = (income, rangeStart, rangeEnd) => {
  if (!income.isRecurring || !income.recurrence?.frequency) {
    return [income];
  }

  const occurrences = [];
  const baseDate = new Date(income.date);
  const effectiveEnd = income.recurrence.endDate
    ? new Date(Math.min(new Date(income.recurrence.endDate).getTime(), rangeEnd.getTime()))
    : rangeEnd;

  let current = new Date(baseDate);

  const advance = (date, frequency) => {
    const next = new Date(date);
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        break;
    }
    return next;
  };

  // If the base date is after the range, no occurrences
  if (current > effectiveEnd) {
    return [];
  }

  // Advance to the first occurrence within or before the range
  // (we need to find the first occurrence >= rangeStart)
  while (current < rangeStart) {
    const next = advance(current, income.recurrence.frequency);
    if (next > effectiveEnd) break;
    current = next;
  }

  // Generate occurrences within the range
  while (current <= effectiveEnd) {
    if (current >= rangeStart) {
      const obj = typeof income.toObject === 'function' ? income.toObject() : { ...income };
      occurrences.push({
        ...obj,
        date: new Date(current),
        _isExpanded: true, // marker for virtual occurrences
      });
    }
    current = advance(current, income.recurrence.frequency);
  }

  return occurrences;
};

/**
 * Parse pagination parameters from query string.
 * When limit > 0, pagination is active. When limit = 0, all results are returned.
 * @param {Object} query - Express req.query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(0, parseInt(query.limit) || 0);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = {
  escapeRegex,
  calculateSplits,
  validateExpenseUsers,
  resolveGroupMembers,
  storePendingInvites,
  expandRecurringIncome,
  parsePagination,
};
