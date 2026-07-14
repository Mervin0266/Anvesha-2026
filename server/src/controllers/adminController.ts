import { Request, Response } from 'express';
import { dbQuery, withTransaction, addAuditLog } from '../services/db';
import { EmailService } from '../services/emailService';

export const getAdminOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const instsCountRes = await dbQuery('SELECT COUNT(*) FROM institutions');
    const partsCountRes = await dbQuery('SELECT COUNT(*) FROM participants');
    const verifiedPartsRes = await dbQuery("SELECT COUNT(*) FROM participants WHERE verification_status = 'VERIFIED'");
    const teamsCountRes = await dbQuery('SELECT COUNT(*) FROM teams');
    const revenueRes = await dbQuery("SELECT SUM(amount) FROM payments WHERE status IN ('SUCCESS', 'PENDING')");
    
    const editsRes = await dbQuery('SELECT * FROM edit_requests ORDER BY requested_at DESC');
    const usersRes = await dbQuery('SELECT * FROM users');
    const logsRes = await dbQuery('SELECT * FROM audit_logs ORDER BY timestamp DESC');

    const totalInstitutions = parseInt(instsCountRes.rows[0].count, 10);
    const totalParticipants = parseInt(partsCountRes.rows[0].count, 10);
    const verifiedParticipants = parseInt(verifiedPartsRes.rows[0].count, 10);
    const totalTeams = parseInt(teamsCountRes.rows[0].count, 10);
    const totalRevenue = parseFloat(revenueRes.rows[0].sum || '0');

    const mappedEdits = editsRes.rows.map((e: any) => ({
      id: e.id,
      eventId: e.event_id,
      facultyName: e.faculty_name,
      facultyId: e.faculty_id,
      reason: e.reason,
      requestedAt: e.requested_at,
      status: e.status,
      adminRemarks: e.admin_remarks
    }));

    const mappedUsers = usersRes.rows.map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      email: u.email,
      eventId: u.event_id
    }));

    const mappedLogs = logsRes.rows.map((l: any) => ({
      id: l.id,
      timestamp: l.timestamp,
      user: l.user_name,
      role: l.role,
      action: l.action,
      details: l.details
    }));

    res.json({
      success: true,
      stats: {
        totalInstitutions,
        totalParticipants,
        verifiedParticipants,
        totalTeams,
        totalRevenue,
        pendingEditRequestsCount: mappedEdits.filter((e: any) => e.status === 'PENDING').length
      },
      editRequests: mappedEdits,
      users: mappedUsers,
      auditLogs: mappedLogs
    });
  } catch (error: any) {
    console.error('getAdminOverview error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin overview.' });
  }
};

export const handleEditRequest = async (req: Request, res: Response): Promise<void> => {
  const { requestId, status, adminRemarks, adminName } = req.body;

  try {
    const editReqRes = await dbQuery('SELECT * FROM edit_requests WHERE id = $1', [requestId]);
    const reqObj = editReqRes.rows[0];
    if (!reqObj) {
      res.status(404).json({ success: false, message: 'Edit request not found' });
      return;
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE edit_requests SET status = $1, admin_remarks = $2 WHERE id = $3`,
        [status, adminRemarks || null, requestId]
      );

      if (status === 'APPROVED') {
        // Unlock result
        await client.query(
          `UPDATE results SET is_locked = false WHERE event_id = $1`,
          [reqObj.event_id]
        );
      }

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          logId, new Date().toISOString(), adminName || 'Chief Admin', 'admin', `${status}_EDIT_REQUEST`,
          `Admin ${status} edit request for event ${reqObj.event_id}. Remarks: ${adminRemarks || 'None'}`
        ]
      );
    });

    res.json({
      success: true,
      message: `Edit request has been ${status.toLowerCase()}. ${status === 'APPROVED' ? 'Event score sheet is now UNLOCKED for faculty edit.' : ''}`
    });
  } catch (error: any) {
    console.error('handleEditRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to handle edit request.' });
  }
};

export const createCrewUser = async (req: Request, res: Response): Promise<void> => {
  const { username, name, role, email, eventId } = req.body;

  try {
    const checkRes = await dbQuery('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    if (checkRes.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Username already exists.' });
      return;
    }

    const userId = `usr_${Date.now()}`;
    await dbQuery(
      `INSERT INTO users (id, username, name, role, email, event_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, username, name, role, email, eventId || null]
    );

    await addAuditLog('Chief Admin', 'admin', 'CREATE_USER', `Created user ${username} with role ${role}`);

    res.json({
      success: true,
      user: {
        id: userId,
        username,
        name,
        role,
        email,
        eventId
      }
    });
  } catch (error: any) {
    console.error('createCrewUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

export const getBankPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const listRes = await dbQuery('SELECT * FROM bank_payments ORDER BY date DESC');
    const mapped = listRes.rows.map((p: any) => ({
      id: p.id,
      transactionId: p.transaction_id,
      institutionName: p.institution_name,
      email: p.email,
      phone: p.phone,
      amount: Number(p.amount),
      date: p.date,
      status: p.status,
      registrationId: p.registration_id,
      invitationSent: p.invitation_sent,
      invitationSentAt: p.invitation_sent_at,
      principalName: p.principal_name,
      eventName: p.event_name,
      address: p.address
    }));

    res.json({ success: true, bankPayments: mapped });
  } catch (error: any) {
    console.error('getBankPayments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bank payments.' });
  }
};

export const addBankPayment = async (req: Request, res: Response): Promise<void> => {
  const { transactionId, institutionName, email, phone, amount, date, principalName, eventName, address } = req.body;

  try {
    const checkRes = await dbQuery('SELECT * FROM bank_payments WHERE LOWER(transaction_id) = LOWER($1)', [transactionId]);
    if (checkRes.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Transaction ID already exists in the records.' });
      return;
    }

    const id = `BP-SIB-${Date.now()}`;
    const dateStr = date || new Date().toISOString();
    await dbQuery(
      `INSERT INTO bank_payments (id, transaction_id, institution_name, email, phone, amount, date, status, invitation_sent, principal_name, event_name, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, transactionId, institutionName, email, phone || null, Number(amount), dateStr, 'PENDING', false, principalName || null, eventName || null, address || null]
    );

    await addAuditLog(
      'Chief Admin',
      'admin',
      'ADD_BANK_PAYMENT',
      `Added bank payment record: ${transactionId} for ${institutionName} (₹${amount})`
    );

    const newPayment = {
      id,
      transactionId,
      institutionName,
      email,
      phone,
      amount: Number(amount),
      date: dateStr,
      status: 'PENDING',
      invitationSent: false,
      principalName,
      eventName,
      address
    };

    res.json({ success: true, bankPayment: newPayment });
  } catch (error: any) {
    console.error('addBankPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add bank payment.' });
  }
};

export const bulkAddBankPayments = async (req: Request, res: Response): Promise<void> => {
  const { payments } = req.body;

  if (!Array.isArray(payments)) {
    res.status(400).json({ success: false, message: 'Invalid payload. payments must be an array.' });
    return;
  }

  try {
    const results = await withTransaction(async (client) => {
      const added: any[] = [];
      const skipped: string[] = [];

      for (let i = 0; i < payments.length; i++) {
        const item = payments[i];
        const { transactionId, institutionName, email, phone, amount, date, principalName, eventName, address } = item;
        
        if (!transactionId || !institutionName || !email || isNaN(Number(amount))) {
          continue;
        }

        const checkRes = await client.query('SELECT * FROM bank_payments WHERE LOWER(transaction_id) = LOWER($1)', [transactionId]);
        if (checkRes.rows.length > 0) {
          skipped.push(transactionId);
          continue;
        }

        const id = `BP-SIB-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
        const dateStr = date || new Date().toISOString();
        
        await client.query(
          `INSERT INTO bank_payments (id, transaction_id, institution_name, email, phone, amount, date, status, invitation_sent, principal_name, event_name, address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [id, transactionId, institutionName, email, phone || null, Number(amount), dateStr, 'PENDING', false, principalName || null, eventName || null, address || null]
        );

        added.push({
          id,
          transactionId,
          institutionName,
          email,
          phone,
          amount: Number(amount),
          date: dateStr,
          status: 'PENDING',
          invitationSent: false,
          principalName,
          eventName,
          address
        });
      }

      if (added.length > 0) {
        const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await client.query(
          `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            logId, new Date().toISOString(), 'Chief Admin', 'admin', 'BULK_ADD_BANK_PAYMENTS',
            `Imported ${added.length} bank payment records in bulk.`
          ]
        );
      }

      return { added, skipped };
    });

    res.json({ 
      success: true, 
      addedCount: results.added.length, 
      skippedCount: results.skipped.length, 
      skippedTxns: results.skipped,
      addedPayments: results.added
    });
  } catch (error: any) {
    console.error('bulkAddBankPayments error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk import bank payments.' });
  }
};

export const bulkSendRegistrationInvitations = async (req: Request, res: Response): Promise<void> => {
  const { paymentIds } = req.body;

  if (!Array.isArray(paymentIds)) {
    res.status(400).json({ success: false, message: 'Invalid payload. paymentIds must be an array.' });
    return;
  }

  try {
    const invited: string[] = [];

    for (const pId of paymentIds) {
      const paymentRes = await dbQuery("SELECT * FROM bank_payments WHERE id = $1 AND status = 'PENDING'", [pId]);
      const payment = paymentRes.rows[0];
      if (!payment) continue;

      const sentAt = new Date().toISOString();
      await dbQuery(
        `UPDATE bank_payments SET invitation_sent = true, invitation_sent_at = $1 WHERE id = $2`,
        [sentAt, pId]
      );
      invited.push(payment.email);

      const registrationLink = `/register`;
      const sendRes = await EmailService.sendInvitationEmail({
        to: payment.email,
        registrationLink,
        institutionName: payment.institution_name,
        amount: Number(payment.amount),
        transactionId: payment.transaction_id,
        eventName: payment.event_name,
      });

      await addAuditLog(
        'Chief Admin',
        'admin',
        'SEND_INVITATION',
        `Sent registration invite to ${payment.email} for transaction ${payment.transaction_id} (Mode: ${sendRes.mode})`
      );
    }

    res.json({ success: true, invitedCount: invited.length, invitedEmails: invited });
  } catch (error: any) {
    console.error('bulkSendRegistrationInvitations error:', error);
    res.status(500).json({ success: false, message: 'Failed to send invitations in bulk.' });
  }
};

export const sendRegistrationInvitation = async (req: Request, res: Response): Promise<void> => {
  const { paymentId, email } = req.body;

  try {
    let payment: any = null;
    if (paymentId) {
      const pRes = await dbQuery('SELECT * FROM bank_payments WHERE id = $1', [paymentId]);
      payment = pRes.rows[0];
    } else if (email) {
      const pRes = await dbQuery("SELECT * FROM bank_payments WHERE LOWER(email) = LOWER($1) AND status = 'PENDING' LIMIT 1", [email]);
      payment = pRes.rows[0];
    }

    if (!payment) {
      res.status(404).json({ success: false, message: 'No pending bank payment record found.' });
      return;
    }

    const sentAt = new Date().toISOString();
    let updatedEmail = payment.email;
    if (email && payment.email.toLowerCase() !== email.toLowerCase()) {
      updatedEmail = email;
    }

    await dbQuery(
      `UPDATE bank_payments SET invitation_sent = true, invitation_sent_at = $1, email = $2 WHERE id = $3`,
      [sentAt, updatedEmail, payment.id]
    );

    const registrationLink = `/register`;
    const sendRes = await EmailService.sendInvitationEmail({
      to: updatedEmail,
      registrationLink,
      institutionName: payment.institution_name,
      amount: Number(payment.amount),
      transactionId: payment.transaction_id,
      eventName: payment.event_name,
    });

    await addAuditLog(
      'Chief Admin',
      'admin',
      'SEND_INVITATION',
      `Sent registration invite to ${updatedEmail} for transaction ${payment.transaction_id} (Mode: ${sendRes.mode})`
    );

    const updatedPayment = {
      id: payment.id,
      transactionId: payment.transaction_id,
      institutionName: payment.institution_name,
      email: updatedEmail,
      phone: payment.phone,
      amount: Number(payment.amount),
      date: payment.date,
      status: payment.status,
      registrationId: payment.registration_id,
      invitationSent: true,
      invitationSentAt: sentAt,
      principalName: payment.principal_name,
      eventName: payment.event_name,
      address: payment.address
    };

    res.json({
      success: true,
      message: `Invitation email sent successfully to ${updatedEmail} (${sendRes.mode}).`,
      registrationLink,
      payment: updatedPayment
    });
  } catch (error: any) {
    console.error('sendRegistrationInvitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to send registration invite.' });
  }
};

export const updateBankPayment = async (req: Request, res: Response): Promise<void> => {
  const { id, transactionId, institutionName, email, phone, amount, principalName, eventName, address } = req.body;

  try {
    const checkRes = await dbQuery('SELECT * FROM bank_payments WHERE id = $1', [id]);
    const current = checkRes.rows[0];
    if (!current) {
      res.status(404).json({ success: false, message: 'Bank payment record not found.' });
      return;
    }

    if (transactionId && transactionId !== current.transaction_id) {
      const dupRes = await dbQuery('SELECT * FROM bank_payments WHERE id != $1 AND LOWER(transaction_id) = LOWER($2)', [id, transactionId]);
      if (dupRes.rows.length > 0) {
        res.status(400).json({ success: false, message: 'Transaction ID already exists in another record.' });
        return;
      }
    }

    const updatedTxnId = transactionId !== undefined ? transactionId : current.transaction_id;
    const updatedName = institutionName !== undefined ? institutionName : current.institution_name;
    const updatedEmail = email !== undefined ? email : current.email;
    const updatedPhone = phone !== undefined ? phone : current.phone;
    const updatedAmount = amount !== undefined ? Number(amount) : Number(current.amount);
    const updatedPrincipal = principalName !== undefined ? principalName : current.principal_name;
    const updatedEvent = eventName !== undefined ? eventName : current.event_name;
    const updatedAddress = address !== undefined ? address : current.address;

    await dbQuery(
      `UPDATE bank_payments 
       SET transaction_id = $1, institution_name = $2, email = $3, phone = $4, amount = $5, principal_name = $6, event_name = $7, address = $8
       WHERE id = $9`,
      [updatedTxnId, updatedName, updatedEmail, updatedPhone, updatedAmount, updatedPrincipal, updatedEvent, updatedAddress, id]
    );

    await addAuditLog(
      'Chief Admin',
      'admin',
      'UPDATE_BANK_PAYMENT',
      `Updated SIB payment record ${id}: Transaction ID: ${updatedTxnId}, Institution: ${updatedName} (₹${updatedAmount})`
    );

    const updatedPayment = {
      id,
      transactionId: updatedTxnId,
      institutionName: updatedName,
      email: updatedEmail,
      phone: updatedPhone,
      amount: updatedAmount,
      date: current.date,
      status: current.status,
      registrationId: current.registration_id,
      invitationSent: current.invitation_sent,
      invitationSentAt: current.invitation_sent_at,
      principalName: updatedPrincipal,
      eventName: updatedEvent,
      address: updatedAddress
    };

    res.json({ success: true, bankPayment: updatedPayment });
  } catch (error: any) {
    console.error('updateBankPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update bank payment.' });
  }
};

export const deleteCrewUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const userRes = await dbQuery('SELECT * FROM users WHERE id = $1', [userId]);
    const userObj = userRes.rows[0];

    if (!userObj) {
      res.status(404).json({ success: false, message: 'User account not found.' });
      return;
    }

    if (userObj.role === 'admin') {
      res.status(400).json({ success: false, message: 'Cannot delete the Chief Admin account.' });
      return;
    }

    await dbQuery('DELETE FROM users WHERE id = $1', [userId]);
    await addAuditLog(
      'Chief Admin',
      'admin',
      'DELETE_USER',
      `Deleted crew user account: ${userObj.username} (${userObj.name})`
    );

    res.json({ success: true, message: 'User account deleted successfully.' });
  } catch (error: any) {
    console.error('deleteCrewUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user account.' });
  }
};

export const deleteBankPayment = async (req: Request, res: Response): Promise<void> => {
  const { paymentId } = req.params;

  try {
    const bpRes = await dbQuery('SELECT * FROM bank_payments WHERE id = $1', [paymentId]);
    const bp = bpRes.rows[0];

    if (!bp) {
      res.status(404).json({ success: false, message: 'Transaction record not found.' });
      return;
    }

    if (bp.status === 'USED') {
      res.status(400).json({ success: false, message: 'Cannot delete a transaction record that has already been used for registration.' });
      return;
    }

    await dbQuery('DELETE FROM bank_payments WHERE id = $1', [paymentId]);
    await addAuditLog(
      'Chief Admin',
      'admin',
      'DELETE_BANK_PAYMENT',
      `Deleted SIB transaction record: ${bp.transaction_id} (${bp.institution_name})`
    );

    res.json({ success: true, message: 'Transaction record deleted successfully.' });
  } catch (error: any) {
    console.error('deleteBankPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction record.' });
  }
};

export const bulkAddInstitutionMaster = async (req: Request, res: Response): Promise<void> => {
  const { institutions } = req.body;

  if (!Array.isArray(institutions)) {
    res.status(400).json({ success: false, message: 'Invalid payload. institutions must be an array.' });
    return;
  }

  try {
    const results = await withTransaction(async (client) => {
      let addedCount = 0;
      let updatedCount = 0;

      for (const item of institutions) {
        const { institutionName, pocName, pocNumber, pocEmailId } = item;

        if (!institutionName || !institutionName.trim()) {
          continue;
        }

        const nameTrimmed = institutionName.trim();
        const checkRes = await client.query(
          'SELECT id FROM institution_master WHERE LOWER(institution_name) = LOWER($1)',
          [nameTrimmed]
        );

        if (checkRes.rows.length > 0) {
          await client.query(
            `UPDATE institution_master 
             SET poc_name = $1, poc_number = $2, poc_email_id = $3
             WHERE LOWER(institution_name) = LOWER($4)`,
            [
              pocName && pocName.trim() ? pocName.trim() : null,
              pocNumber && pocNumber.trim() ? pocNumber.trim() : null,
              pocEmailId && pocEmailId.trim() ? pocEmailId.trim() : null,
              nameTrimmed
            ]
          );
          updatedCount++;
        } else {
          const id = `inst_m_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO institution_master (id, institution_name, poc_name, poc_number, poc_email_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              id,
              nameTrimmed,
              pocName && pocName.trim() ? pocName.trim() : null,
              pocNumber && pocNumber.trim() ? pocNumber.trim() : null,
              pocEmailId && pocEmailId.trim() ? pocEmailId.trim() : null
            ]
          );
          addedCount++;
        }
      }

      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          new Date().toISOString(),
          'Chief Admin',
          'admin',
          'BULK_ADD_INSTITUTION_MASTER',
          `Bulk uploaded master institutions: ${addedCount} added, ${updatedCount} updated.`
        ]
      );

      return { addedCount, updatedCount };
    });

    res.json({
      success: true,
      message: `Bulk import completed successfully.`,
      addedCount: results.addedCount,
      updatedCount: results.updatedCount
    });
  } catch (error: any) {
    console.error('bulkAddInstitutionMaster error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk import master institutions.' });
  }
};

export const getInstitutionMastersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const listRes = await dbQuery('SELECT * FROM institution_master ORDER BY institution_name ASC');
    const mapped = listRes.rows.map((m: any) => ({
      id: m.id,
      institutionName: m.institution_name,
      pocName: m.poc_name || '',
      pocNumber: m.poc_number || '',
      pocEmailId: m.poc_email_id || ''
    }));

    res.json({ success: true, institutions: mapped });
  } catch (error: any) {
    console.error('getInstitutionMastersList error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch master institutions list.' });
  }
};

export const deleteInstitutionMaster = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const checkRes = await dbQuery('SELECT * FROM institution_master WHERE id = $1', [id]);
    const inst = checkRes.rows[0];

    if (!inst) {
      res.status(404).json({ success: false, message: 'Master record not found.' });
      return;
    }

    await dbQuery('DELETE FROM institution_master WHERE id = $1', [id]);
    await addAuditLog(
      'Chief Admin',
      'admin',
      'DELETE_INSTITUTION_MASTER',
      `Deleted master institution: ${inst.institution_name}`
    );

    res.json({ success: true, message: 'Master record deleted successfully.' });
  } catch (error: any) {
    console.error('deleteInstitutionMaster error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete master record.' });
  }
};
