import { Request, Response } from 'express';
import { dbQuery, withTransaction } from '../services/db';

export const getPendingVerifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const instsRes = await dbQuery('SELECT * FROM institutions ORDER BY created_at DESC');
    const teamsRes = await dbQuery('SELECT * FROM teams');
    const partsRes = await dbQuery('SELECT * FROM participants');
    const paysRes = await dbQuery('SELECT * FROM payments');
    const versRes = await dbQuery('SELECT * FROM verifications');
    const contactsRes = await dbQuery('SELECT * FROM contacts');

    const institutions = instsRes.rows;
    const teams = teamsRes.rows;
    const participants = partsRes.rows;
    const payments = paysRes.rows;
    const verifications = versRes.rows;
    const contacts = contactsRes.rows;

    const results = institutions.map((inst: any) => {
      const mappedInst = {
        id: inst.id,
        registrationId: inst.registration_id,
        name: inst.name,
        principalName: inst.principal_name,
        address: inst.address,
        district: inst.district,
        state: inst.state,
        pincode: inst.pincode,
        schoolContactNumber: inst.school_contact_number,
        schoolEmail: inst.school_email,
        createdAt: inst.created_at
      };

      const instTeams = teams
        .filter((t: any) => t.institution_id === inst.id)
        .map((t: any) => ({
          id: t.id,
          registrationId: t.registration_id,
          institutionId: t.institution_id,
          eventId: t.event_id,
          teamName: t.team_name,
          captainId: t.captain_id,
          coachName: t.coach_name,
          mentorName: t.mentor_name,
          status: t.status
        }));

      const instParts = participants
        .filter((p: any) => p.institution_id === inst.id)
        .map((p: any) => ({
          id: p.id,
          registrationId: p.registration_id,
          institutionId: p.institution_id,
          teamId: p.team_id,
          eventId: p.event_id,
          name: p.name,
          gender: p.gender,
          dob: p.dob,
          className: p.class_name,
          section: p.section,
          phone: p.phone,
          email: p.email,
          govtIdProof: p.govt_id_proof,
          emergencyContact: p.emergency_contact,
          medicalInfo: p.medical_info,
          chestNumber: p.chest_number,
          verificationStatus: p.verification_status,
          jerseyNumber: p.jersey_number,
          rosterStatus: p.roster_status,
          checkInStatus: p.check_in_status
        }));

      const paymentObj = payments.find((p: any) => p.institution_id === inst.id);
      const mappedPayment = paymentObj ? {
        id: paymentObj.id,
        registrationId: paymentObj.registration_id,
        institutionId: paymentObj.institution_id,
        amount: Number(paymentObj.amount),
        transactionId: paymentObj.transaction_id,
        receiptNumber: paymentObj.receipt_number,
        paymentProofUrl: paymentObj.payment_proof_url,
        status: paymentObj.status,
        date: paymentObj.date
      } : null;

      const verObj = verifications.find((v: any) => v.institution_id === inst.id);
      const mappedVer = verObj ? {
        id: verObj.id,
        registrationId: verObj.registration_id,
        institutionId: verObj.institution_id,
        verifiedBy: verObj.verified_by,
        verifiedAt: verObj.verified_at,
        status: verObj.status,
        remarks: verObj.remarks
      } : null;

      const poc = contacts.find((c: any) => c.institution_id === inst.id && c.type === 'POC');
      const mentor = contacts.find((c: any) => c.institution_id === inst.id && c.type === 'MENTOR');

      const mappedPoc = poc ? {
        id: poc.id,
        institutionId: poc.institution_id,
        type: poc.type,
        name: poc.name,
        designation: poc.designation,
        phone: poc.phone,
        email: poc.email,
        govtIdProof: poc.govt_id_proof
      } : null;

      const mappedMentor = mentor ? {
        id: mentor.id,
        institutionId: mentor.institution_id,
        type: mentor.type,
        name: mentor.name,
        designation: mentor.designation,
        phone: mentor.phone,
        email: mentor.email,
        govtIdProof: mentor.govt_id_proof
      } : null;

      return {
        institution: mappedInst,
        poc: mappedPoc,
        mentor: mappedMentor,
        teams: instTeams,
        participants: instParts,
        payment: mappedPayment,
        verificationStatus: mappedVer ? mappedVer.status : 'PENDING',
        verificationDetails: mappedVer
      };
    });

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch verifications.' });
  }
};

export const approveVerification = async (req: Request, res: Response): Promise<void> => {
  const { institutionId, remarks, verifierName } = req.body;

  try {
    const instRes = await dbQuery('SELECT * FROM institutions WHERE id = $1', [institutionId]);
    const inst = instRes.rows[0];
    if (!inst) {
      res.status(404).json({ success: false, message: 'Institution not found' });
      return;
    }

    const assignedCount = await withTransaction(async (client) => {
      // 1. Create or Update Verification Record
      const verCheck = await client.query('SELECT * FROM verifications WHERE institution_id = $1', [institutionId]);
      if (verCheck.rows.length === 0) {
        const verId = `ver_${Date.now()}`;
        await client.query(
          `INSERT INTO verifications (id, registration_id, institution_id, verified_by, verified_at, status, remarks)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [verId, inst.registration_id, institutionId, verifierName || 'Registration Team', new Date().toISOString(), 'VERIFIED', remarks]
        );
      } else {
        await client.query(
          `UPDATE verifications SET status = 'VERIFIED', verified_at = $1, verified_by = $2, remarks = $3 WHERE institution_id = $4`,
          [new Date().toISOString(), verifierName || 'Registration Team', remarks, institutionId]
        );
      }

      // 2. Update Teams status to VERIFIED
      await client.query(
        `UPDATE teams SET status = 'VERIFIED' WHERE institution_id = $1`,
        [institutionId]
      );

      // 3. Update Payment status to SUCCESS
      await client.query(
        `UPDATE payments SET status = 'SUCCESS' WHERE institution_id = $1`,
        [institutionId]
      );

      // 4. Assign Chest Numbers to Teams & set VERIFIED
      const teamsRes = await client.query('SELECT * FROM teams WHERE institution_id = $1', [institutionId]);
      const teams = teamsRes.rows;

      let chestCounter = 100 + Math.floor(Math.random() * 50);
      for (let idx = 0; idx < teams.length; idx++) {
        const t = teams[idx];
        let chestNumber = t.chest_number;
        if (!chestNumber) {
          const prefix = t.event_id.includes('football') ? 'FB' :
                         t.event_id.includes('volleyball') ? 'VB' :
                         t.event_id.includes('basketball') ? 'BB' :
                         t.event_id.includes('tug_of_war') ? 'TW' :
                         t.event_id.includes('dance') ? 'DN' :
                         t.event_id.includes('music') ? 'MU' :
                         t.event_id.includes('debate') ? 'DB' :
                         t.event_id.includes('open_mic') ? 'OM' : 'TH';
          chestNumber = `${prefix}-${chestCounter + idx}`;
        }

        await client.query(
          `UPDATE teams 
           SET status = 'VERIFIED', chest_number = $1
           WHERE id = $2`,
          [chestNumber, t.id]
        );

        // Assign same chest number to all participants of this team
        await client.query(
          `UPDATE participants 
           SET verification_status = 'VERIFIED', chest_number = $1
           WHERE team_id = $2`,
          [chestNumber, t.id]
        );
      }

      // 5. Audit Log
      const partsRes = await client.query('SELECT id FROM participants WHERE institution_id = $1', [institutionId]);
      const participantCount = partsRes.rows.length;

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          logId, new Date().toISOString(), verifierName || 'Registration Team', 'registration_team', 'APPROVE_REGISTRATION',
          `Verified institution ${inst.name} (${inst.registration_id}). Assigned chest numbers to ${participantCount} participants.`
        ]
      );

      return participantCount;
    });

    res.json({
      success: true,
      message: `Institution ${inst.name} has been successfully verified! Chest numbers assigned.`,
      assignedParticipants: assignedCount
    });
  } catch (error: any) {
    console.error('Approve verification error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to approve verification.' });
  }
};

export const rejectVerification = async (req: Request, res: Response): Promise<void> => {
  const { institutionId, remarks, verifierName } = req.body;

  try {
    const instRes = await dbQuery('SELECT * FROM institutions WHERE id = $1', [institutionId]);
    const inst = instRes.rows[0];
    if (!inst) {
      res.status(404).json({ success: false, message: 'Institution not found' });
      return;
    }

    await withTransaction(async (client) => {
      // 1. Create or Update Verification Record
      const verCheck = await client.query('SELECT * FROM verifications WHERE institution_id = $1', [institutionId]);
      if (verCheck.rows.length === 0) {
        const verId = `ver_${Date.now()}`;
        await client.query(
          `INSERT INTO verifications (id, registration_id, institution_id, verified_by, verified_at, status, remarks)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [verId, inst.registration_id, institutionId, verifierName || 'Registration Team', new Date().toISOString(), 'REJECTED', remarks]
        );
      } else {
        await client.query(
          `UPDATE verifications SET status = 'REJECTED', remarks = $1, verified_at = $2, verified_by = $3 WHERE institution_id = $4`,
          [remarks, new Date().toISOString(), verifierName || 'Registration Team', institutionId]
        );
      }

      // 2. Update Teams status
      await client.query(
        `UPDATE teams SET status = 'REJECTED' WHERE institution_id = $1`,
        [institutionId]
      );

      // 3. Update Participants status
      await client.query(
        `UPDATE participants SET verification_status = 'REJECTED' WHERE institution_id = $1`,
        [institutionId]
      );

      // 4. Audit Log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          logId, new Date().toISOString(), verifierName || 'Registration Team', 'registration_team', 'REJECT_REGISTRATION',
          `Rejected registration for ${inst.name} (${inst.registration_id}). Reason: ${remarks}`
        ]
      );
    });

    res.json({ success: true, message: `Registration for ${inst.name} marked as Rejected.` });
  } catch (error: any) {
    console.error('Reject verification error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reject verification.' });
  }
};
