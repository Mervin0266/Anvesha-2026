import { Request, Response } from 'express';
import { dbQuery, withTransaction } from '../services/db';

export const getMasterInstitutions = async (req: Request, res: Response): Promise<void> => {
  try {
    const rowsRes = await dbQuery("SELECT * FROM bank_payments WHERE status = 'PENDING'");
    const bankPayments = rowsRes.rows;

    // Load dropdown selections directly from BankPayments pending ledger
    const filteredMaster = bankPayments.map((p: any) => {
      // Fallback place resolution from address
      let place = 'Bengaluru';
      if (p.address) {
        const parts = p.address.split(',');
        if (parts.length > 0) {
          place = parts[0].trim();
        }
      }

      return {
        id: p.id,
        name: p.institution_name,
        place: place,
        address: p.address || '',
        pincode: '',
        bankPaymentId: p.id,
        transactionId: p.transaction_id,
        amount: Number(p.amount),
        email: p.email,
        schoolContactNumber: p.phone || '',
        principalName: p.principal_name || '',
        eventName: p.event_name || ''
      };
    });

    res.json({ success: true, data: filteredMaster });
  } catch (err) {
    console.error('Failed to get master institutions:', err);
    res.json({ success: true, data: [] });
  }
};

export const validateParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, dob, govtIdProof, eventId } = req.body;

    const govtIdLower = (govtIdProof || '').toLowerCase().trim();
    const nameLower = (name || '').toLowerCase().trim();

    // Rule 2: One participant can participate in ONLY ONE EVENT
    const queryRes = await dbQuery(
      `SELECT * FROM participants 
       WHERE LOWER(govt_id_proof) = $1 
          OR (LOWER(name) = $2 AND dob = $3)
       LIMIT 1`,
      [govtIdLower, nameLower, dob]
    );

    const existingInAnotherEvent = queryRes.rows[0];

    if (existingInAnotherEvent) {
      if (existingInAnotherEvent.event_id !== eventId) {
        res.json({
          valid: false,
          error: `Participant '${name}' is ALREADY registered in another event (${existingInAnotherEvent.event_id}). Rule 2 violation: One participant can participate in ONLY ONE event.`
        });
        return;
      } else {
        res.json({
          valid: false,
          error: `Participant '${name}' is ALREADY registered under this event. Duplicate entry detected.`
        });
        return;
      }
    }

    res.json({ valid: true });
  } catch (error: any) {
    console.error('Participant validation error:', error);
    res.status(500).json({ success: false, message: 'Validation failed.' });
  }
};

export const submitRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { institution, poc, teams, participants, payment, paymentId } = req.body;

    // Verify Rule 1 in payload (no more than 2 teams per event in the submission itself)
    const eventCounts: Record<string, number> = {};
    for (const teamItem of teams) {
      eventCounts[teamItem.eventId] = (eventCounts[teamItem.eventId] || 0) + 1;
      if (eventCounts[teamItem.eventId] > 2) {
        res.status(400).json({
          success: false,
          message: `Rule 1 Violation: Institution '${institution.name}' cannot register more than 2 teams for event '${teamItem.eventId}'.`
        });
        return;
      }
    }

    const result = await withTransaction(async (client) => {
      // Verify SIB Bank Payment reference if provided
      let isBankPayment = false;
      let bankPaymentObj: any = null;
      if (paymentId) {
        const bpRes = await client.query('SELECT * FROM bank_payments WHERE id = $1', [paymentId]);
        bankPaymentObj = bpRes.rows[0];
        if (!bankPaymentObj) {
          throw new Error('Invalid bank payment reference.');
        }
        if (bankPaymentObj.status === 'USED') {
          throw new Error('This bank payment reference has already been used.');
        }
        isBankPayment = true;
      }

      // Generate Registration ID
      const countRes = await client.query('SELECT COUNT(*) FROM institutions');
      const regCount = parseInt(countRes.rows[0].count, 10) + 1001;
      const registrationId = `ANV-2026-${regCount}`;
      const instId = `inst_${Date.now()}`;

      // Create Institution Record
      await client.query(
        `INSERT INTO institutions (id, registration_id, name, principal_name, address, district, state, pincode, school_contact_number, school_email, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          instId, registrationId, institution.name, institution.principalName, institution.address,
          institution.district, institution.state, institution.pincode, institution.schoolContactNumber,
          institution.schoolEmail, new Date().toISOString()
        ]
      );

      // Save Contact / POC
      const pocId = `poc_${Date.now()}`;
      await client.query(
        `INSERT INTO contacts (id, institution_id, type, name, designation, phone, email, govt_id_proof)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [pocId, instId, 'POC', poc.name, poc.designation, poc.phone, poc.email, poc.govtIdProof]
      );

      // Process Teams and Participants
      let totalPartsCount = 0;
      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const teamId = `team_${Date.now()}_${i}`;

        await client.query(
          `INSERT INTO teams (id, registration_id, institution_id, event_id, team_name, coach_name, mentor_name, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [teamId, registrationId, instId, t.eventId, t.teamName, t.coachName || null, poc.name, 'PENDING']
        );

        const teamParts = participants.filter((p: any) => p.teamIndex === i);
        for (let j = 0; j < teamParts.length; j++) {
          const p = teamParts[j];
          const partId = `part_${Date.now()}_${i}_${j}`;
          totalPartsCount++;
          
          await client.query(
            `INSERT INTO participants (id, registration_id, institution_id, team_id, event_id, name, gender, dob, class_name, section, phone, email, govt_id_proof, emergency_contact, medical_info, chest_number, verification_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
              partId, registrationId, instId, teamId, t.eventId, p.name, p.gender, p.dob, p.className, p.section,
              p.phone || null, p.email || null, p.govtIdProof, p.emergencyContact, p.medicalInfo || null, null, 'PENDING'
            ]
          );
        }
      }

      // Save Payment
      const newPaymentId = `pay_${Date.now()}`;
      const receiptNumber = isBankPayment ? `RCP-SIB-2026-${Math.floor(1000 + Math.random() * 9000)}` : `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentStatus = isBankPayment ? 'SUCCESS' : 'PENDING';

      await client.query(
        `INSERT INTO payments (id, registration_id, institution_id, amount, transaction_id, receipt_number, payment_proof_url, status, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newPaymentId, registrationId, instId, Number(payment.amount), payment.transactionId, receiptNumber,
          payment.paymentProofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
          paymentStatus, new Date().toISOString()
        ]
      );

      // Update SIB Bank Payment to USED
      if (isBankPayment && bankPaymentObj) {
        await client.query(
          `UPDATE bank_payments SET status = 'USED', registration_id = $1 WHERE id = $2`,
          [registrationId, paymentId]
        );
      }

      // Initial Hospitality Entry
      const hospId = `hosp_${Date.now()}`;
      await client.query(
        `INSERT INTO hospitality (id, institution_id, arrival_status, food_preference, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [hospId, instId, 'NOT_ARRIVED', 'Veg', new Date().toISOString()]
      );

      // Save Audit Log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          logId, new Date().toISOString(), 'System', 'PUBLIC_USER', 'SUBMIT_REGISTRATION',
          `New Institution registered: ${institution.name} (${registrationId}) with ${totalPartsCount} participants.`
        ]
      );

      return {
        registrationId,
        institutionName: institution.name,
        totalTeams: teams.length,
        totalParticipants: totalPartsCount,
        amountPaid: Number(payment.amount)
      };
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process registration.' });
  }
};

export const getBankPaymentDetails = async (req: Request, res: Response): Promise<void> => {
  const { paymentId } = req.params;

  try {
    const bpRes = await dbQuery(
      `SELECT * FROM bank_payments WHERE id = $1 OR transaction_id = $1 LIMIT 1`,
      [paymentId]
    );
    const payment = bpRes.rows[0];

    if (!payment) {
      res.status(404).json({ success: false, message: 'Bank payment record not found.' });
      return;
    }

    if (payment.status === 'USED') {
      res.status(400).json({ success: false, message: 'This payment reference has already been used for registration.' });
      return;
    }

    // Map DB underscore fields back to camelCase for type safety on the client
    const mapped = {
      id: payment.id,
      transactionId: payment.transaction_id,
      institutionName: payment.institution_name,
      email: payment.email,
      phone: payment.phone,
      amount: Number(payment.amount),
      date: payment.date,
      status: payment.status,
      registrationId: payment.registration_id,
      invitationSent: payment.invitation_sent,
      invitationSentAt: payment.invitation_sent_at,
      principalName: payment.principal_name,
      eventName: payment.event_name,
      address: payment.address
    };

    res.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error('Error fetching bank payment details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve SIB details.' });
  }
};
