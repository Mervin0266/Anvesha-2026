import { Request, Response } from 'express';
import { dbQuery, addAuditLog } from '../services/db';

export const getHospitalityData = async (req: Request, res: Response): Promise<void> => {
  try {
    // ONLY VERIFIED INSTITUTIONS & PARTICIPANTS appear in Hospitality Desk
    const instsRes = await dbQuery(
      `SELECT i.* FROM institutions i
       JOIN verifications v ON v.institution_id = i.id
       WHERE v.status = 'VERIFIED'
       ORDER BY i.name ASC`
    );
    const verifiedInstitutions = instsRes.rows;

    const partsRes = await dbQuery("SELECT * FROM participants WHERE verification_status = 'VERIFIED'");
    const participants = partsRes.rows;

    const hospitalityRes = await dbQuery('SELECT * FROM hospitality');
    const hospitality = hospitalityRes.rows;

    const contactsRes = await dbQuery('SELECT * FROM contacts');
    const contacts = contactsRes.rows;

    const list = verifiedInstitutions.map((inst: any) => {
      const verifiedParts = participants
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

      const hosp = hospitality.find((h: any) => h.institution_id === inst.id);
      const poc = contacts.find((c: any) => c.institution_id === inst.id && c.type === 'POC');
      const mentor = contacts.find((c: any) => c.institution_id === inst.id && c.type === 'MENTOR');

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

      const mappedHosp = hosp ? {
        id: hosp.id,
        institutionId: hosp.institution_id,
        arrivalStatus: hosp.arrival_status,
        arrivalTime: hosp.arrival_time,
        accommodationHall: hosp.accommodation_hall,
        foodPreference: hosp.food_preference,
        specialRequirements: hosp.special_requirements,
        updatedAt: hosp.updated_at
      } : {
        id: `hosp_${inst.id}`,
        institutionId: inst.id,
        arrivalStatus: 'NOT_ARRIVED',
        foodPreference: 'Veg',
        updatedAt: new Date().toISOString()
      };

      return {
        institution: mappedInst,
        poc: mappedPoc,
        mentor: mappedMentor,
        participantsCount: verifiedParts.length,
        participants: verifiedParts,
        hospitality: mappedHosp
      };
    });

    res.json({ success: true, data: list });
  } catch (error: any) {
    console.error('getHospitalityData error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve hospitality list.' });
  }
};

export const updateHospitalityStatus = async (req: Request, res: Response): Promise<void> => {
  const { institutionId, arrivalStatus, arrivalTime, accommodationHall, foodPreference, specialRequirements, user } = req.body;

  try {
    const checkRes = await dbQuery('SELECT * FROM hospitality WHERE institution_id = $1', [institutionId]);
    let hospRecord: any = null;
    const nowStr = new Date().toISOString();

    if (checkRes.rows.length === 0) {
      const generatedId = `hosp_${Date.now()}`;
      await dbQuery(
        `INSERT INTO hospitality (id, institution_id, arrival_status, arrival_time, accommodation_hall, food_preference, special_requirements, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          generatedId, institutionId, arrivalStatus || 'CHECKED_IN', arrivalTime || nowStr,
          accommodationHall || null, foodPreference || 'Veg', specialRequirements || '', nowStr
        ]
      );
      const selectNew = await dbQuery('SELECT * FROM hospitality WHERE id = $1', [generatedId]);
      hospRecord = selectNew.rows[0];
    } else {
      const current = checkRes.rows[0];
      const updatedArrivalStatus = arrivalStatus || current.arrival_status;
      const updatedArrivalTime = arrivalTime || current.arrival_time;
      const updatedAccommodation = accommodationHall !== undefined ? accommodationHall : current.accommodation_hall;
      const updatedFood = foodPreference || current.food_preference;
      const updatedSpecial = specialRequirements !== undefined ? specialRequirements : current.special_requirements;

      await dbQuery(
        `UPDATE hospitality 
         SET arrival_status = $1, arrival_time = $2, accommodation_hall = $3, food_preference = $4, special_requirements = $5, updated_at = $6
         WHERE institution_id = $7`,
        [updatedArrivalStatus, updatedArrivalTime, updatedAccommodation, updatedFood, updatedSpecial, nowStr, institutionId]
      );
      const selectNew = await dbQuery('SELECT * FROM hospitality WHERE institution_id = $1', [institutionId]);
      hospRecord = selectNew.rows[0];
    }

    const instRes = await dbQuery('SELECT name FROM institutions WHERE id = $1', [institutionId]);
    const instName = instRes.rows[0] ? instRes.rows[0].name : 'Unknown Institution';

    await addAuditLog(
      user?.name || 'Hospitality Desk',
      'hospitality_team',
      'UPDATE_HOSPITALITY',
      `Updated arrival status to '${hospRecord.arrival_status}' for ${instName}`
    );

    const mappedHosp = {
      id: hospRecord.id,
      institutionId: hospRecord.institution_id,
      arrivalStatus: hospRecord.arrival_status,
      arrivalTime: hospRecord.arrival_time,
      accommodationHall: hospRecord.accommodation_hall,
      foodPreference: hospRecord.food_preference,
      specialRequirements: hospRecord.special_requirements,
      updatedAt: hospRecord.updated_at
    };

    res.json({ success: true, message: 'Hospitality status updated.', hospitality: mappedHosp });
  } catch (error: any) {
    console.error('Update hospitality status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update hospitality record.' });
  }
};
