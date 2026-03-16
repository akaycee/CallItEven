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
  // Combine paidBy and split user IDs into a single query to avoid N+1
  const splitUserIds = splits.map(s => s.user);
  const allUserIds = [paidBy, ...splitUserIds.filter(id => id.toString() !== paidBy.toString())];
  const allUsers = await User.find({ _id: { $in: allUserIds } }).select('_id isAdmin').lean();

  const paidByUser = allUsers.find(u => u._id.toString() === paidBy.toString());
  if (!paidByUser) {
    return { valid: false, error: 'Invalid paidBy user' };
  }
  if (paidByUser.isAdmin) {
    return { valid: false, error: 'Admin users cannot be added to expenses' };
  }

  const foundSplitUsers = allUsers.filter(u => splitUserIds.some(id => id.toString() === u._id.toString()));
  if (foundSplitUsers.length !== splitUserIds.length) {
    return { valid: false, error: 'Invalid user in splits' };
  }

  if (foundSplitUsers.some(u => u.isAdmin)) {
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

/**
 * Build a standardised user response object.
 * @param {Object} user - Mongoose user document or plain object
 * @param {string} [token] - Optional JWT token to include
 * @returns {Object} Sanitised user payload
 */
const toUserResponse = (user, token) => {
  const res = {
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin || false,
    themeMode: user.themeMode || 'light',
  };
  if (user.notes !== undefined) res.notes = user.notes || '';
  if (token) res.token = token;
  return res;
};

/**
 * Parse startDate / endDate from req.query with a fallback to the current month.
 * @param {Object} query - Express req.query
 * @returns {{ startDate: Date, endDate: Date }}
 */
const parseDateRange = (query) => {
  if (query.startDate && query.endDate) {
    return {
      startDate: new Date(query.startDate + 'T00:00:00.000Z'),
      endDate: new Date(query.endDate + 'T23:59:59.999Z'),
    };
  }
  const now = new Date();
  return {
    startDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    endDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
  };
};

/**
 * Fetch income entries (non-recurring + expanded recurring) for a user within a date range.
 * @param {Object} Income - Mongoose Income model
 * @param {Object} baseQuery - Base filter (e.g. { user: userId })
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>} Combined array of income objects (lean)
 */
const fetchIncomeWithRecurring = async (Income, baseQuery, startDate, endDate) => {
  const nonRecurring = await Income.find({
    ...baseQuery,
    isRecurring: { $ne: true },
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 }).lean();

  const recurring = await Income.find({
    ...baseQuery,
    isRecurring: true,
    date: { $lte: endDate },
  }).sort({ date: -1 }).lean();

  const expandedRecurring = recurring.flatMap(inc =>
    expandRecurringIncome(inc, startDate, endDate)
  );

  return [...nonRecurring, ...expandedRecurring];
};

/**
 * Resolve splits for an expense (personal or shared).
 * Validates users, calculates amounts, and returns calculated splits.
 * @param {Object} params
 * @param {boolean} params.isPersonal
 * @param {Object} params.userId - Current user's ObjectId
 * @param {number} params.totalAmount
 * @param {string} params.paidBy
 * @param {string} params.splitType
 * @param {Array}  params.splits
 * @param {Object} params.User - Mongoose User model
 * @returns {Promise<{ splits: Array|null, error: string|null }>}
 */
const resolveExpenseSplits = async ({ isPersonal, userId, totalAmount, paidBy, splitType, splits, User }) => {
  if (isPersonal) {
    return {
      splits: [{
        user: userId,
        amount: parseFloat(totalAmount),
        percentage: 100,
      }],
      error: null,
    };
  }

  const validation = await validateExpenseUsers(paidBy, splits, User);
  if (!validation.valid) {
    return { splits: null, error: validation.error };
  }

  return {
    splits: calculateSplits(totalAmount, splitType, splits),
    error: null,
  };
};

module.exports = {
  escapeRegex,
  calculateSplits,
  validateExpenseUsers,
  resolveGroupMembers,
  storePendingInvites,
  expandRecurringIncome,
  parsePagination,
  toUserResponse,
  parseDateRange,
  fetchIncomeWithRecurring,
  resolveExpenseSplits,
};
