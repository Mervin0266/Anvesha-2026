import { Request, Response } from 'express';
import { dbQuery, withTransaction } from '../services/db';

export const getMasterInstitutions = async (req: Request, res: Response): Promise<void> => {
  try {
    const rowsRes = await dbQuery("SELECT * FROM institution_master ORDER BY institution_name ASC");
    const masterInstitutions = rowsRes.rows;

    const filteredMaster = masterInstitutions.map((m: any) => {
      return {
        id: m.id,
        name: m.institution_name,
        pocName: m.poc_name || '',
        pocNumber: m.poc_number || '',
        pocEmailId: m.poc_email_id || '',
        place: '',
        address: '',
        pincode: '',
        principalName: '',
        schoolContactNumber: '',
        schoolEmail: ''
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

    // Fetch the new event's details
    const eventRes = await dbQuery('SELECT category FROM events WHERE id = $1', [eventId]);
    const newEventCategory = eventRes.rows[0]?.category;

    // Check if the participant is registered in another event
    const queryRes = await dbQuery(
      `SELECT p.*, e.category as existing_event_category FROM participants p
       JOIN events e ON p.event_id = e.id
       WHERE LOWER(p.govt_id_proof) = $1 
          OR (LOWER(p.name) = $2 AND p.dob = $3)`,
      [govtIdLower, nameLower, dob]
    );

    const existingRegistrations = queryRes.rows;

      // Check if they are trying to register for the exact same event
      const sameEventReg = existingRegistrations.find((r: any) => r.event_id === eventId);
      if (sameEventReg) {
        res.json({
          valid: false,
          error: `Participant '${name}' is ALREADY registered under this event. Duplicate entry detected.`
        });
        return;
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

    // Fetch event categories for Rule 1 bypass
    const eventIds = teams.map((t: any) => t.eventId);
    const dbEvtsRes = await dbQuery('SELECT id, category FROM events WHERE id = ANY($1)', [eventIds]);
    const dbEvts = dbEvtsRes.rows;

    // Verify Rule 1 in payload (no more than 2 teams per event in the submission itself)
    const eventCounts: Record<string, number> = {};
    for (const teamItem of teams) {
      const dbEvt = dbEvts.find((e: any) => e.id === teamItem.eventId);
      if (dbEvt && dbEvt.category === 'FUN_ACTIVITIES') {
        continue;
      }
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
          instId, registrationId, institution.name, institution.principalName || 'N/A', institution.address,
          institution.district, institution.state, institution.pincode || 'N/A', institution.schoolContactNumber || 'N/A',
          institution.schoolEmail || 'N/A', new Date().toISOString()
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

export const spotRegisterInstitution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, pocName, pocNumber, pocEmail, participants } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Institution Name is required.' });
      return;
    }

    const result = await withTransaction(async (client) => {
      // 1. Fetch catalog events to resolve event registrations and fees
      const dbEventsRes = await client.query('SELECT * FROM events');
      const dbEvents = dbEventsRes.rows;

      // 2. Generate Registration ID & Institution ID
      const countRes = await client.query('SELECT COUNT(*) FROM institutions');
      const regCount = parseInt(countRes.rows[0].count, 10) + 1001;
      const registrationId = `ANV-2026-${regCount}`;
      const instId = `inst_${Date.now()}_spot_${Math.floor(Math.random() * 1000)}`;

      // 3. Create Institution Record
      await client.query(
        `INSERT INTO institutions (id, registration_id, name, principal_name, address, district, state, pincode, school_contact_number, school_email, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          instId, registrationId, name.trim(), pocName ? pocName.trim() : 'Principal',
          address ? address.trim() : 'Spot Registered', 'Bengaluru', 'Karnataka', '560001',
          pocNumber ? pocNumber.trim() : '080-22222222', pocEmail ? pocEmail.trim() : 'poc@institution.edu',
          new Date().toISOString()
        ]
      );

      // 4. Save Contact / POC
      const pocId = `poc_${Date.now()}_spot`;
      await client.query(
        `INSERT INTO contacts (id, institution_id, type, name, designation, phone, email, govt_id_proof)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          pocId, instId, 'POC', pocName ? pocName.trim() : 'Coordinator', 'Co-ordinator',
          pocNumber ? pocNumber.trim() : '080-22222222', pocEmail ? pocEmail.trim() : 'poc@institution.edu',
          'NIL'
        ]
      );

      // 5. Group participants by (eventId + teamName)
      const teamGroups: Record<string, any[]> = {};
      for (const p of (participants || [])) {
        const key = `${p.eventId}_${p.teamName || 'Team A'}`;
        if (!teamGroups[key]) teamGroups[key] = [];
        teamGroups[key].push(p);
      }

      let chestCounter = 100 + Math.floor(Math.random() * 50);
      let totalFee = 0;

      // 6. Loop through each team group
      for (const key of Object.keys(teamGroups)) {
        const group = teamGroups[key];
        const firstP = group[0];
        const eventId = firstP.eventId;
        const teamName = firstP.teamName || 'Team A';

        const resolvedEvt = dbEvents.find(e => e.id === eventId);
        if (!resolvedEvt) {
          throw new Error(`Invalid event ID: '${eventId}'`);
        }

        totalFee += Number(resolvedEvt.registration_fee || 0);
        const teamId = `team_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Generate official chest number prefix
        const prefix = eventId.includes('football') ? 'FB' :
                       eventId.includes('volleyball') ? 'VB' :
                       eventId.includes('tug_of_war') ? 'TW' :
                       eventId.includes('dance') ? 'DN' :
                       eventId.includes('music') ? 'MU' :
                       eventId.includes('debate') ? 'DB' :
                       eventId.includes('open_mic') ? 'OM' : 'TH';

        const chestNumber = `${prefix}-${chestCounter}`;
        chestCounter += 1;

        // Create verified team
        await client.query(
          `INSERT INTO teams (id, registration_id, institution_id, event_id, team_name, status, chest_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [teamId, registrationId, instId, eventId, teamName, 'VERIFIED', chestNumber]
        );

        // Save participants
        for (let pIdx = 0; pIdx < group.length; pIdx++) {
          const p = group[pIdx];
          const partId = `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          
          await client.query(
            `INSERT INTO participants (id, registration_id, institution_id, team_id, event_id, name, gender, dob, class_name, section, phone, email, govt_id_proof, emergency_contact, medical_info, chest_number, verification_status, student_register_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              partId, registrationId, instId, teamId, eventId, p.name, p.gender, p.dob, p.className, 'A',
              p.phone || '0000000000', p.email || 'student@spot.com', p.govtIdProof || `SPOT-${partId}`,
              p.emergencyContact || '0000000000', '', chestNumber, 'VERIFIED', p.studentRegisterNumber || 'NIL'
            ]
          );

          // Seed hospitality record
          const hospId = `hosp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO hospitality (id, participant_id, registration_id, status)
             VALUES ($1, $2, $3, $4)`,
            [hospId, partId, registrationId, 'PENDING']
          );
        }
      }

      // 7. Log Spot Payment
      const paymentId = `pay_${Date.now()}_spot`;
      const receiptNumber = `RCP-SPOT-SIB-${Math.floor(1000 + Math.random() * 9000)}`;
      await client.query(
        `INSERT INTO payments (id, registration_id, institution_id, amount, transaction_id, receipt_number, payment_status, payment_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          paymentId, registrationId, instId, totalFee, `TXN-SPOT-${Date.now()}`, receiptNumber, 'PAID', new Date().toISOString()
        ]
      );

      // 8. Create Verification record
      const verId = `ver_${Date.now()}_spot`;
      await client.query(
        `INSERT INTO verification_records (id, registration_id, institution_id, verified_by, verified_at, status, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [verId, registrationId, instId, 'Registration Spot Desk', new Date().toISOString(), 'VERIFIED', 'Registered directly on the spot by Registration Crew.']
      );

      // 9. Create Audit log
      const logId = `log_${Date.now()}_spot`;
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, user_role, action, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          logId, new Date().toISOString(), 'Registration Desk', 'registration_team', 'SPOT_REGISTER_INSTITUTION',
          `On-site spot registration for '${name}' completed. ${participants.length} students enrolled.`
        ]
      );

      return { registrationId, name };
    });

    res.json({ success: true, message: 'Spot registration successful.', data: result });
  } catch (error: any) {
    console.error('Spot registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Spot registration failed.' });
  }
};
