import { Request, Response } from 'express';
import { dbQuery, addAuditLog } from '../services/db';
import { EVENTS_CATALOG } from '../../../src/data/eventsCatalog';

export const getEventData = async (req: Request, res: Response): Promise<void> => {
  const eventId = req.params.eventId as string;

  try {
    // 1. Get fixtures
    const fixturesRes = await dbQuery('SELECT * FROM fixtures WHERE event_id = $1', [eventId]);
    const fixtures = fixturesRes.rows.map((f: any) => ({
      id: f.id,
      eventId: f.event_id,
      round: f.round,
      teamAId: f.team_a_id,
      teamBId: f.team_b_id,
      teamAName: f.team_a_name,
      teamBName: f.team_b_name,
      scheduledTime: f.scheduled_time,
      venue: f.venue,
      scoreA: f.score_a,
      scoreB: f.score_b,
      winnerTeamId: f.winner_team_id,
      status: f.status,
      remarks: f.remarks,
      judgeScores: typeof f.judge_scores === 'string' ? JSON.parse(f.judge_scores) : f.judge_scores,
      sportsStats: typeof f.sports_stats === 'string' ? JSON.parse(f.sports_stats) : f.sports_stats,
      culturalJudges: typeof f.cultural_judges === 'string' ? JSON.parse(f.cultural_judges) : f.cultural_judges,
      debateStats: typeof f.debate_stats === 'string' ? JSON.parse(f.debate_stats) : f.debate_stats,
      treasureHuntStats: typeof f.treasure_hunt_stats === 'string' ? JSON.parse(f.treasure_hunt_stats) : f.treasure_hunt_stats
    }));

    // 2. Get results
    const resultsRes = await dbQuery('SELECT * FROM results WHERE event_id = $1 LIMIT 1', [eventId]);
    const result = resultsRes.rows[0];
    const mappedResult = result ? {
      id: result.id,
      eventId: result.event_id,
      winnerTeamId: result.winner_team_id,
      winnerTeamName: result.winner_team_name,
      winnerInstitutionName: result.winner_institution_name,
      runnerUpTeamId: result.runner_up_team_id,
      runnerUpTeamName: result.runner_up_team_name,
      runnerUpInstitutionName: result.runner_up_institution_name,
      secondRunnerUpTeamId: result.second_runner_up_team_id,
      secondRunnerUpTeamName: result.second_runner_up_team_name,
      secondRunnerUpInstitutionName: result.second_runner_up_institution_name,
      submittedBy: result.submitted_by,
      submittedAt: result.submitted_at,
      isLocked: result.is_locked,
      totalMatches: result.total_matches || 0,
      matchDetails: typeof result.match_details === 'string' ? JSON.parse(result.match_details) : (result.match_details || [])
    } : null;

    // 3. Get pending edit requests
    const editsRes = await dbQuery("SELECT * FROM edit_requests WHERE event_id = $1 AND status = 'PENDING' LIMIT 1", [eventId]);
    const pendingEditRequest = editsRes.rows[0] ? {
      id: editsRes.rows[0].id,
      eventId: editsRes.rows[0].event_id,
      facultyName: editsRes.rows[0].faculty_name,
      facultyId: editsRes.rows[0].faculty_id,
      reason: editsRes.rows[0].reason,
      requestedAt: editsRes.rows[0].requested_at,
      status: editsRes.rows[0].status,
      adminRemarks: editsRes.rows[0].admin_remarks
    } : null;

    // 4. Get event day live status
    let stateRes = await dbQuery('SELECT * FROM event_states WHERE event_id = $1', [eventId]);
    let eventState = stateRes.rows[0];
    if (!eventState) {
      await dbQuery(
        `INSERT INTO event_states (event_id, venue, status, delay_minutes, attendance_checked, officials)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [eventId, 'Main Arena Court', 'SCHEDULED', 0, false, '[]']
      );
      stateRes = await dbQuery('SELECT * FROM event_states WHERE event_id = $1', [eventId]);
      eventState = stateRes.rows[0];
    }
    const mappedEventState = {
      eventId: eventState.event_id,
      venue: eventState.venue,
      status: eventState.status,
      delayMinutes: eventState.delay_minutes,
      delayReason: eventState.delay_reason,
      attendanceChecked: eventState.attendance_checked,
      officials: typeof eventState.officials === 'string' ? JSON.parse(eventState.officials) : eventState.officials
    };

    // 5. Get teams & participants for this event
    const teamsRes = await dbQuery('SELECT * FROM teams WHERE event_id = $1', [eventId]);
    const participantsRes = await dbQuery('SELECT * FROM participants WHERE event_id = $1', [eventId]);
    const instsRes = await dbQuery('SELECT id, name FROM institutions');

    const participants = participantsRes.rows.map((p: any) => ({
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

    const mappedTeams = teamsRes.rows.map((t: any) => {
      const inst = instsRes.rows.find((i: any) => i.id === t.institution_id);
      const teamPartIds = participants.filter((p: any) => p.teamId === t.id).map((p: any) => p.id);
      return {
        id: t.id,
        registrationId: t.registration_id,
        institutionId: t.institution_id,
        eventId: t.event_id,
        teamName: t.team_name,
        captainId: t.captain_id,
        coachName: t.coach_name,
        mentorName: t.mentor_name,
        participantIds: teamPartIds,
        status: t.status,
        institutionName: inst ? inst.name : 'Unknown Institution'
      };
    });

    res.json({
      success: true,
      eventId,
      fixtures,
      result: mappedResult,
      isLocked: mappedResult ? mappedResult.isLocked : false,
      pendingEditRequest,
      eventState: mappedEventState,
      teams: mappedTeams,
      participants
    });
  } catch (error: any) {
    console.error('getEventData error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event data.' });
  }
};

export const createOrUpdateFixture = async (req: Request, res: Response): Promise<void> => {
  const { 
    eventId, fixtureId, round, teamAId, teamBId, scheduledTime, venue, 
    scoreA, scoreB, judgeScores, winnerTeamId, status, remarks, user,
    sportsStats, culturalJudges, debateStats, treasureHuntStats
  } = req.body;

  try {
    // Check if result is locked for this event
    const resultsRes = await dbQuery('SELECT * FROM results WHERE event_id = $1 LIMIT 1', [eventId]);
    const result = resultsRes.rows[0];
    if (result && result.is_locked) {
      res.status(403).json({
        success: false,
        message: 'Result for this event is LOCKED. You must request an edit from Admin to modify fixtures or scores.'
      });
      return;
    }

    // Resolve team names
    let teamAName = 'Team A';
    let teamBName = 'Team B';

    if (teamAId) {
      const tARes = await dbQuery(
        `SELECT t.team_name, i.name as inst_name 
         FROM teams t 
         JOIN institutions i ON t.institution_id = i.id 
         WHERE t.id = $1`, 
        [teamAId]
      );
      if (tARes.rows[0]) {
        teamAName = `${tARes.rows[0].inst_name} (${tARes.rows[0].team_name})`;
      }
    }
    if (teamBId) {
      const tBRes = await dbQuery(
        `SELECT t.team_name, i.name as inst_name 
         FROM teams t 
         JOIN institutions i ON t.institution_id = i.id 
         WHERE t.id = $1`, 
        [teamBId]
      );
      if (tBRes.rows[0]) {
        teamBName = `${tBRes.rows[0].inst_name} (${tBRes.rows[0].team_name})`;
      }
    }

    let fix: any = null;

    if (fixtureId) {
      const fRes = await dbQuery('SELECT * FROM fixtures WHERE id = $1', [fixtureId]);
      if (fRes.rows[0]) {
        const current = fRes.rows[0];
        const updatedRound = round || current.round;
        const updatedTeamAId = teamAId || current.team_a_id;
        const updatedTeamBId = teamBId || current.team_b_id;
        const updatedScheduledTime = scheduledTime || current.scheduled_time;
        const updatedVenue = venue || current.venue;
        const updatedScoreA = scoreA !== undefined ? Number(scoreA) : current.score_a;
        const updatedScoreB = scoreB !== undefined ? Number(scoreB) : current.score_b;
        const updatedJudgeScores = judgeScores !== undefined ? JSON.stringify(judgeScores) : JSON.stringify(current.judge_scores);
        const updatedWinner = winnerTeamId !== undefined ? winnerTeamId : current.winner_team_id;
        const updatedStatus = status !== undefined ? status : current.status;
        const updatedRemarks = remarks !== undefined ? remarks : current.remarks;
        const updatedSportsStats = sportsStats !== undefined ? JSON.stringify(sportsStats) : JSON.stringify(current.sports_stats);
        const updatedCulturalJudges = culturalJudges !== undefined ? JSON.stringify(culturalJudges) : JSON.stringify(current.cultural_judges);
        const updatedDebate = debateStats !== undefined ? JSON.stringify(debateStats) : JSON.stringify(current.debate_stats);
        const updatedTreasure = treasureHuntStats !== undefined ? JSON.stringify(treasureHuntStats) : JSON.stringify(current.treasure_hunt_stats);

        await dbQuery(
          `UPDATE fixtures 
           SET round = $1, team_a_id = $2, team_b_id = $3, team_a_name = $4, team_b_name = $5,
               scheduled_time = $6, venue = $7, score_a = $8, score_b = $9, judge_scores = $10,
               winner_team_id = $11, status = $12, remarks = $13, sports_stats = $14,
               cultural_judges = $15, debate_stats = $16, treasure_hunt_stats = $17
           WHERE id = $18`,
          [
            updatedRound, updatedTeamAId, updatedTeamBId, teamAName, teamBName,
            updatedScheduledTime, updatedVenue, updatedScoreA, updatedScoreB, updatedJudgeScores,
            updatedWinner || null, updatedStatus, updatedRemarks, updatedSportsStats,
            updatedCulturalJudges, updatedDebate, updatedTreasure, fixtureId
          ]
        );
        const updatedFix = await dbQuery('SELECT * FROM fixtures WHERE id = $1', [fixtureId]);
        fix = updatedFix.rows[0];
      }
    } else {
      const generatedId = `fix_${Date.now()}`;
      await dbQuery(
        `INSERT INTO fixtures (id, event_id, round, team_a_id, team_b_id, team_a_name, team_b_name, scheduled_time, venue, score_a, score_b, judge_scores, winner_team_id, status, remarks, sports_stats, cultural_judges, debate_stats, treasure_hunt_stats)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          generatedId, eventId, round, teamAId || null, teamBId || null, teamAName, teamBName, scheduledTime, venue,
          scoreA !== undefined ? Number(scoreA) : 0, scoreB !== undefined ? Number(scoreB) : 0, JSON.stringify(judgeScores || {}),
          winnerTeamId || null, status || 'SCHEDULED', remarks || '', JSON.stringify(sportsStats || {}), JSON.stringify(culturalJudges || {}),
          JSON.stringify(debateStats || {}), JSON.stringify(treasureHuntStats || {})
        ]
      );
      const newFix = await dbQuery('SELECT * FROM fixtures WHERE id = $1', [generatedId]);
      fix = newFix.rows[0];
    }

    if (fix) {
      await addAuditLog(
        user?.name || 'Event Faculty',
        user?.role || 'faculty',
        'UPDATE_FIXTURE',
        `Updated fixture ${fix.id} for event ${eventId}`
      );
      
      const mappedFix = {
        id: fix.id,
        eventId: fix.event_id,
        round: fix.round,
        teamAId: fix.team_a_id,
        teamBId: fix.team_b_id,
        teamAName: fix.team_a_name,
        teamBName: fix.team_b_name,
        scheduledTime: fix.scheduled_time,
        venue: fix.venue,
        scoreA: fix.score_a,
        scoreB: fix.score_b,
        judgeScores: typeof fix.judge_scores === 'string' ? JSON.parse(fix.judge_scores) : fix.judge_scores,
        winnerTeamId: fix.winner_team_id,
        status: fix.status,
        remarks: fix.remarks,
        sportsStats: typeof fix.sports_stats === 'string' ? JSON.parse(fix.sports_stats) : fix.sports_stats,
        culturalJudges: typeof fix.cultural_judges === 'string' ? JSON.parse(fix.cultural_judges) : fix.cultural_judges,
        debateStats: typeof fix.debate_stats === 'string' ? JSON.parse(fix.debate_stats) : fix.debate_stats,
        treasureHuntStats: typeof fix.treasure_hunt_stats === 'string' ? JSON.parse(fix.treasure_hunt_stats) : fix.treasure_hunt_stats
      };

      res.json({ success: true, fixture: mappedFix });
    } else {
      res.status(500).json({ success: false, message: 'Failed to create or update fixture.' });
    }
  } catch (error: any) {
    console.error('Fixture operation failed:', error);
    res.status(500).json({ success: false, message: 'Database save failed.' });
  }
};

export const submitEventResult = async (req: Request, res: Response): Promise<void> => {
  const { eventId, winnerTeamId, runnerUpTeamId, secondRunnerUpTeamId, user } = req.body;

  try {
    const winnerRes = await dbQuery(
      `SELECT t.team_name, i.name as inst_name 
       FROM teams t 
       JOIN institutions i ON t.institution_id = i.id 
       WHERE t.id = $1`,
      [winnerTeamId]
    );
    const winnerData = winnerRes.rows[0];
    const winnerTeamName = winnerData ? winnerData.team_name : 'Winners';
    const winnerInstitutionName = winnerData ? winnerData.inst_name : 'Unknown College';

    let runnerUpTeamName = null;
    let runnerUpInstitutionName = null;
    if (runnerUpTeamId) {
      const runnerRes = await dbQuery(
        `SELECT t.team_name, i.name as inst_name 
         FROM teams t 
         JOIN institutions i ON t.institution_id = i.id 
         WHERE t.id = $1`,
        [runnerUpTeamId]
      );
      if (runnerRes.rows[0]) {
        runnerUpTeamName = runnerRes.rows[0].team_name;
        runnerUpInstitutionName = runnerRes.rows[0].inst_name;
      }
    }

    let secondRunnerUpTeamName = null;
    let secondRunnerUpInstitutionName = null;
    if (secondRunnerUpTeamId) {
      const secondRunnerRes = await dbQuery(
        `SELECT t.team_name, i.name as inst_name 
         FROM teams t 
         JOIN institutions i ON t.institution_id = i.id 
         WHERE t.id = $1`,
        [secondRunnerUpTeamId]
      );
      if (secondRunnerRes.rows[0]) {
        secondRunnerUpTeamName = secondRunnerRes.rows[0].team_name;
        secondRunnerUpInstitutionName = secondRunnerRes.rows[0].inst_name;
      }
    }

    const checkRes = await dbQuery('SELECT * FROM results WHERE event_id = $1', [eventId]);
    let resultRecord: any = null;
    const nowStr = new Date().toISOString();

    if (checkRes.rows.length === 0) {
      const resId = `res_${Date.now()}`;
      await dbQuery(
        `INSERT INTO results (id, event_id, winner_team_id, winner_team_name, winner_institution_name, runner_up_team_id, runner_up_team_name, runner_up_institution_name, second_runner_up_team_id, second_runner_up_team_name, second_runner_up_institution_name, submitted_by, submitted_at, is_locked)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          resId, eventId, winnerTeamId, winnerTeamName, winnerInstitutionName,
          runnerUpTeamId || null, runnerUpTeamName, runnerUpInstitutionName,
          secondRunnerUpTeamId || null, secondRunnerUpTeamName, secondRunnerUpInstitutionName,
          user?.name || 'Event Faculty', nowStr, true
        ]
      );
      const newRes = await dbQuery('SELECT * FROM results WHERE id = $1', [resId]);
      resultRecord = newRes.rows[0];
    } else {
      await dbQuery(
        `UPDATE results 
         SET winner_team_id = $1, winner_team_name = $2, winner_institution_name = $3,
             runner_up_team_id = $4, runner_up_team_name = $5, runner_up_institution_name = $6,
             second_runner_up_team_id = $7, second_runner_up_team_name = $8, second_runner_up_institution_name = $9,
             submitted_by = $10, submitted_at = $11, is_locked = true
         WHERE event_id = $12`,
        [
          winnerTeamId, winnerTeamName, winnerInstitutionName,
          runnerUpTeamId || null, runnerUpTeamName, runnerUpInstitutionName,
          secondRunnerUpTeamId || null, secondRunnerUpTeamName, secondRunnerUpInstitutionName,
          user?.name || 'Event Faculty', nowStr, eventId
        ]
      );
      const updatedRes = await dbQuery('SELECT * FROM results WHERE event_id = $1', [eventId]);
      resultRecord = updatedRes.rows[0];
    }

    await addAuditLog(
      user?.name || 'Event Faculty',
      user?.role || 'faculty',
      'SUBMIT_EVENT_RESULT',
      `Submitted and LOCKED official final results for event ${eventId}. Winner: ${winnerInstitutionName}`
    );

    const mappedResult = {
      id: resultRecord.id,
      eventId: resultRecord.event_id,
      winnerTeamId: resultRecord.winner_team_id,
      winnerTeamName: resultRecord.winner_team_name,
      winnerInstitutionName: resultRecord.winner_institution_name,
      runnerUpTeamId: resultRecord.runner_up_team_id,
      runnerUpTeamName: resultRecord.runner_up_team_name,
      runnerUpInstitutionName: resultRecord.runner_up_institution_name,
      secondRunnerUpTeamId: resultRecord.second_runner_up_team_id,
      secondRunnerUpTeamName: resultRecord.second_runner_up_team_name,
      secondRunnerUpInstitutionName: resultRecord.second_runner_up_institution_name,
      submittedBy: resultRecord.submitted_by,
      submittedAt: resultRecord.submitted_at,
      isLocked: resultRecord.is_locked
    };

    res.json({
      success: true,
      message: 'Official event results submitted successfully! Result sheet is now LOCKED.',
      result: mappedResult
    });
  } catch (error: any) {
    console.error('Submit event result error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit event results.' });
  }
};

export const requestEdit = async (req: Request, res: Response): Promise<void> => {
  const { eventId, reason, user } = req.body;

  try {
    const editReqId = `edit_req_${Date.now()}`;
    const requestedAt = new Date().toISOString();

    await dbQuery(
      `INSERT INTO edit_requests (id, event_id, faculty_name, faculty_id, reason, requested_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        editReqId, eventId, user?.name || 'Faculty Member', user?.id || 'usr_faculty',
        reason, requestedAt, 'PENDING'
      ]
    );

    await addAuditLog(
      user?.name || 'Event Faculty',
      user?.role || 'faculty',
      'REQUEST_RESULT_EDIT',
      `Requested edit permission for locked event ${eventId}. Reason: ${reason}`
    );

    const editReq = {
      id: editReqId,
      eventId,
      facultyName: user?.name || 'Faculty Member',
      facultyId: user?.id || 'usr_faculty',
      reason,
      requestedAt,
      status: 'PENDING'
    };

    res.json({
      success: true,
      message: 'Your edit request has been sent to Admin for review.',
      request: editReq
    });
  } catch (error: any) {
    console.error('Request edit error:', error);
    res.status(500).json({ success: false, message: 'Failed to request edit.' });
  }
};

export const updateEventLiveStatus = async (req: Request, res: Response): Promise<void> => {
  const eventId = req.params.eventId as string;
  const { venue, status, delayMinutes, delayReason, officials, attendanceChecked, user } = req.body;

  try {
    const stateCheck = await dbQuery('SELECT * FROM event_states WHERE event_id = $1', [eventId]);
    let stateRecord: any = null;

    if (stateCheck.rows.length === 0) {
      await dbQuery(
        `INSERT INTO event_states (event_id, venue, status, delay_minutes, delay_reason, attendance_checked, officials)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          eventId, venue || 'Main Arena Court', status || 'SCHEDULED', Number(delayMinutes || 0),
          delayReason || '', !!attendanceChecked, JSON.stringify(officials || [])
        ]
      );
      const checkNew = await dbQuery('SELECT * FROM event_states WHERE event_id = $1', [eventId]);
      stateRecord = checkNew.rows[0];
    } else {
      const current = stateCheck.rows[0];
      const updatedVenue = venue !== undefined ? venue : current.venue;
      const updatedStatus = status !== undefined ? status : current.status;
      const updatedDelayMinutes = delayMinutes !== undefined ? Number(delayMinutes) : current.delay_minutes;
      const updatedDelayReason = delayReason !== undefined ? delayReason : current.delay_reason;
      const updatedOfficials = officials !== undefined ? JSON.stringify(officials) : JSON.stringify(current.officials);
      const updatedAttendanceChecked = attendanceChecked !== undefined ? !!attendanceChecked : current.attendance_checked;

      await dbQuery(
        `UPDATE event_states 
         SET venue = $1, status = $2, delay_minutes = $3, delay_reason = $4, officials = $5, attendance_checked = $6
         WHERE event_id = $7`,
        [updatedVenue, updatedStatus, updatedDelayMinutes, updatedDelayReason, updatedOfficials, updatedAttendanceChecked, eventId]
      );
      const checkNew = await dbQuery('SELECT * FROM event_states WHERE event_id = $1', [eventId]);
      stateRecord = checkNew.rows[0];
    }

    await addAuditLog(
      user?.name || 'Event Faculty',
      user?.role || 'faculty',
      'UPDATE_EVENT_STATUS',
      `Updated live status for event ${eventId} to status: ${stateRecord.status}, delay: ${stateRecord.delay_minutes} mins.`
    );

    const mappedState = {
      eventId: stateRecord.event_id,
      venue: stateRecord.venue,
      status: stateRecord.status,
      delayMinutes: stateRecord.delay_minutes,
      delayReason: stateRecord.delay_reason,
      attendanceChecked: stateRecord.attendance_checked,
      officials: typeof stateRecord.officials === 'string' ? JSON.parse(stateRecord.officials) : stateRecord.officials
    };

    res.json({ success: true, eventState: mappedState });
  } catch (error: any) {
    console.error('Update live status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update live status.' });
  }
};

export const updateRosterStatus = async (req: Request, res: Response): Promise<void> => {
  const eventId = req.params.eventId as string;
  const { participantId, jerseyNumber, rosterStatus, checkInStatus, verificationStatus, user } = req.body;

  try {
    const partRes = await dbQuery('SELECT * FROM participants WHERE id = $1 AND event_id = $2', [participantId, eventId]);
    const part = partRes.rows[0];
    if (!part) {
      res.status(404).json({ success: false, message: 'Participant not found for this event.' });
      return;
    }

    const updatedJersey = jerseyNumber !== undefined ? jerseyNumber : part.jersey_number;
    const updatedRoster = rosterStatus !== undefined ? rosterStatus : part.roster_status;
    const updatedCheckIn = checkInStatus !== undefined ? checkInStatus : part.check_in_status;
    const updatedVerification = verificationStatus !== undefined ? verificationStatus : part.verification_status;

    await dbQuery(
      `UPDATE participants 
       SET jersey_number = $1, roster_status = $2, check_in_status = $3, verification_status = $4
       WHERE id = $5`,
      [updatedJersey, updatedRoster, updatedCheckIn, updatedVerification, participantId]
    );

    const updatedRes = await dbQuery('SELECT * FROM participants WHERE id = $1', [participantId]);
    const updatedPart = updatedRes.rows[0];

    await addAuditLog(
      user?.name || 'Event Faculty',
      user?.role || 'faculty',
      'UPDATE_ROSTER',
      `Updated roster credentials for participant ${updatedPart.name} (ID: ${participantId}) in event ${eventId}`
    );

    const mappedPart = {
      id: updatedPart.id,
      registrationId: updatedPart.registration_id,
      institutionId: updatedPart.institution_id,
      teamId: updatedPart.team_id,
      eventId: updatedPart.event_id,
      name: updatedPart.name,
      gender: updatedPart.gender,
      dob: updatedPart.dob,
      className: updatedPart.class_name,
      section: updatedPart.section,
      phone: updatedPart.phone,
      email: updatedPart.email,
      govtIdProof: updatedPart.govt_id_proof,
      emergencyContact: updatedPart.emergency_contact,
      medicalInfo: updatedPart.medical_info,
      chestNumber: updatedPart.chest_number,
      verificationStatus: updatedPart.verification_status,
      jerseyNumber: updatedPart.jersey_number,
      rosterStatus: updatedPart.roster_status,
      checkInStatus: updatedPart.check_in_status
    };

    res.json({ success: true, participant: mappedPart });
  } catch (error: any) {
    console.error('Update roster status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update roster.' });
  }
};

export const getEventsList = async (req: Request, res: Response): Promise<void> => {
  try {
    const listRes = await dbQuery('SELECT * FROM events');
    if (listRes.rows.length > 0) {
      const parsedEvents = listRes.rows.map((row: any) => {
        let rules: string[] = [];
        if (row.rules) {
          try {
            if (typeof row.rules === 'string') {
              rules = JSON.parse(row.rules);
            } else if (Array.isArray(row.rules)) {
              rules = row.rules;
            }
          } catch (e) {
            rules = typeof row.rules === 'string' ? [row.rules] : [];
          }
        }
        return {
          id: row.id,
          name: row.name,
          category: row.category,
          type: row.type,
          minTeamSize: Number(row.min_team_size || 1),
          maxTeamSize: Number(row.max_team_size || 1),
          registrationFee: Number(row.registration_fee || 0),
          description: row.description || '',
          rules: rules,
          eligibility: row.eligibility || ''
        };
      });
      res.json({ success: true, data: parsedEvents });
      return;
    }
    res.json({ success: true, data: EVENTS_CATALOG });
  } catch (err) {
    console.error('getEventsList error:', err);
    res.json({ success: true, data: EVENTS_CATALOG });
  }
};

export const getTeamByChest = async (req: Request, res: Response): Promise<void> => {
  const { chestNumber } = req.params;
  try {
    const teamRes = await dbQuery(
      `SELECT t.*, i.name as institution_name, e.name as event_name, e.category as event_category
       FROM teams t
       JOIN institutions i ON t.institution_id = i.id
       JOIN events e ON t.event_id = e.id
       WHERE t.chest_number = $1`,
      [chestNumber]
    );
    const team = teamRes.rows[0];
    if (!team) {
      res.status(404).json({ success: false, message: `No team found with chest number ${chestNumber}` });
      return;
    }

    const participantsRes = await dbQuery(
      `SELECT id, name, class_name, gender, emergency_contact, verification_status
       FROM participants
       WHERE team_id = $1`,
      [team.id]
    );

    res.json({
      success: true,
      data: {
        id: team.id,
        registrationId: team.registration_id,
        institutionId: team.institution_id,
        eventId: team.event_id,
        eventName: team.event_name,
        category: team.event_category,
        teamName: team.team_name,
        coachName: team.coach_name,
        mentorName: team.mentor_name,
        status: team.status,
        chestNumber: team.chest_number,
        participants: participantsRes.rows.map((p: any) => ({
          id: p.id,
          name: p.name,
          className: p.class_name,
          gender: p.gender,
          emergencyContact: p.emergency_contact,
          verificationStatus: p.verification_status
        }))
      }
    });
  } catch (error: any) {
    console.error('getTeamByChest error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch team.' });
  }
};

export const submitWinnerRunnerByChest = async (req: Request, res: Response): Promise<void> => {
  const { eventId, winnerChest, runnerUpChest, secondRunnerUpChest, user, totalMatches, matchDetails } = req.body;
  try {
    // 1. Resolve winner team
    const winnerRes = await dbQuery(
      `SELECT t.id, t.team_name, i.name as inst_name 
       FROM teams t 
       JOIN institutions i ON t.institution_id = i.id 
       WHERE t.chest_number = $1 AND t.event_id = $2`,
      [winnerChest, eventId]
    );
    const winner = winnerRes.rows[0];
    if (!winner) {
      res.status(400).json({ success: false, message: `Winner chest number ${winnerChest} does not exist or belong to this event.` });
      return;
    }

    // 2. Resolve runner up team
    let runnerUpId = null;
    let runnerUpName = null;
    let runnerUpInst = null;
    if (runnerUpChest) {
      const runnerRes = await dbQuery(
        `SELECT t.id, t.team_name, i.name as inst_name 
         FROM teams t 
         JOIN institutions i ON t.institution_id = i.id 
         WHERE t.chest_number = $1 AND t.event_id = $2`,
        [runnerUpChest, eventId]
      );
      const runner = runnerRes.rows[0];
      if (!runner) {
        res.status(400).json({ success: false, message: `Runner up chest number ${runnerUpChest} does not exist or belong to this event.` });
        return;
      }
      runnerUpId = runner.id;
      runnerUpName = runner.team_name;
      runnerUpInst = runner.inst_name;
    }

    // 3. Resolve second runner up team
    let secondRunnerUpId = null;
    let secondRunnerUpName = null;
    let secondRunnerUpInst = null;
    if (secondRunnerUpChest) {
      const secondRunnerRes = await dbQuery(
        `SELECT t.id, t.team_name, i.name as inst_name 
         FROM teams t 
         JOIN institutions i ON t.institution_id = i.id 
         WHERE t.chest_number = $1 AND t.event_id = $2`,
        [secondRunnerUpChest, eventId]
      );
      const secondRunner = secondRunnerRes.rows[0];
      if (!secondRunner) {
        res.status(400).json({ success: false, message: `Second runner up chest number ${secondRunnerUpChest} does not exist or belong to this event.` });
        return;
      }
      secondRunnerUpId = secondRunner.id;
      secondRunnerUpName = secondRunner.team_name;
      secondRunnerUpInst = secondRunner.inst_name;
    }

    // 4. Save to database
    const checkRes = await dbQuery('SELECT * FROM results WHERE event_id = $1', [eventId]);
    const nowStr = new Date().toISOString();

    if (checkRes.rows.length === 0) {
      const resId = `res_${Date.now()}`;
      await dbQuery(
        `INSERT INTO results (id, event_id, winner_team_id, winner_team_name, winner_institution_name, runner_up_team_id, runner_up_team_name, runner_up_institution_name, second_runner_up_team_id, second_runner_up_team_name, second_runner_up_institution_name, submitted_by, submitted_at, is_locked, total_matches, match_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          resId, eventId, winner.id, winner.team_name, winner.inst_name,
          runnerUpId, runnerUpName, runnerUpInst,
          secondRunnerUpId, secondRunnerUpName, secondRunnerUpInst,
          user?.name || 'Event Coordinator', nowStr, true,
          totalMatches || 0, JSON.stringify(matchDetails || [])
        ]
      );
    } else {
      await dbQuery(
        `UPDATE results 
         SET winner_team_id = $1, winner_team_name = $2, winner_institution_name = $3,
             runner_up_team_id = $4, runner_up_team_name = $5, runner_up_institution_name = $6,
             second_runner_up_team_id = $7, second_runner_up_team_name = $8, second_runner_up_institution_name = $9,
             submitted_by = $10, submitted_at = $11, is_locked = TRUE,
             total_matches = $12, match_details = $13
         WHERE event_id = $14`,
        [
          winner.id, winner.team_name, winner.inst_name,
          runnerUpId, runnerUpName, runnerUpInst,
          secondRunnerUpId, secondRunnerUpName, secondRunnerUpInst,
          user?.name || 'Event Coordinator', nowStr,
          totalMatches || 0, JSON.stringify(matchDetails || []),
          eventId
        ]
      );
    }

    res.json({ success: true, message: 'Winner/Runner details submitted successfully!' });
  } catch (error: any) {
    console.error('submitWinnerRunnerByChest error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit winner/runner details.' });
  }
};

export const addMatchDetails = async (req: Request, res: Response): Promise<void> => {
  const { eventId } = req.params;
  const { round, team1, team2, score1, score2, winner, user } = req.body;

  if (!round || !team1 || !team2 || score1 === undefined || score2 === undefined || !winner) {
    res.status(400).json({ success: false, message: 'All match fields (Round, Team 1, Team 2, Score 1, Score 2, Winner) are required.' });
    return;
  }

  try {
    const checkRes = await dbQuery('SELECT * FROM results WHERE event_id = $1', [eventId]);
    const nowStr = new Date().toISOString();
    let currentDetails: any[] = [];
    let currentTotal = 0;

    if (checkRes.rows.length > 0) {
      const row = checkRes.rows[0];
      currentTotal = row.total_matches || 0;
      currentDetails = typeof row.match_details === 'string' ? JSON.parse(row.match_details) : (row.match_details || []);
    }

    currentDetails.push({
      round: round.trim(),
      team1: team1.trim(),
      team2: team2.trim(),
      score1: score1.trim(),
      score2: score2.trim(),
      winner: winner.trim()
    });
    currentTotal = currentDetails.length;

    if (checkRes.rows.length === 0) {
      const resId = `res_${Date.now()}`;
      await dbQuery(
        `INSERT INTO results (id, event_id, winner_team_id, winner_team_name, winner_institution_name, runner_up_team_id, runner_up_team_name, runner_up_institution_name, second_runner_up_team_id, second_runner_up_team_name, second_runner_up_institution_name, submitted_by, submitted_at, is_locked, total_matches, match_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          resId, eventId, null, 'Winner TBD', 'Institution TBD',
          null, null, null,
          null, null, null,
          user?.name || 'Event Coordinator', nowStr, false,
          currentTotal, JSON.stringify(currentDetails)
        ]
      );
    } else {
      await dbQuery(
        `UPDATE results 
         SET total_matches = $1, match_details = $2, submitted_by = $3, submitted_at = $4
         WHERE event_id = $5`,
        [currentTotal, JSON.stringify(currentDetails), user?.name || 'Event Coordinator', nowStr, eventId]
      );
    }

    await addAuditLog(
      user?.name || 'Event Coordinator',
      user?.role || 'faculty',
      'ADD_MATCH_DETAILS',
      `Logged match: ${team1} vs ${team2} (Winner: ${winner}, Score: ${score1}-${score2}) for event ${eventId}`
    );

    res.status(201).json({ success: true, message: 'Match details added successfully!' });
  } catch (error: any) {
    console.error('addMatchDetails error:', error);
    res.status(500).json({ success: false, message: 'Failed to save match details.' });
  }
};

export const updateMatchDetailsByIndex = async (req: Request, res: Response): Promise<void> => {
  const { eventId, index } = req.params;
  const { round, team1, team2, score1, score2, winner, user } = req.body;
  const matchIdx = parseInt(index as string, 10);

  try {
    const checkRes = await dbQuery('SELECT * FROM results WHERE event_id = $1', [eventId]);
    if (checkRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'No result record found for this event.' });
      return;
    }

    const row = checkRes.rows[0];
    if (row.is_locked) {
      res.status(403).json({ success: false, message: 'Result is locked. Cannot edit match details.' });
      return;
    }

    let currentDetails = typeof row.match_details === 'string' ? JSON.parse(row.match_details) : (row.match_details || []);
    if (matchIdx < 0 || matchIdx >= currentDetails.length) {
      res.status(400).json({ success: false, message: 'Invalid match index.' });
      return;
    }

    currentDetails[matchIdx] = {
      round: round.trim(),
      team1: team1.trim(),
      team2: team2.trim(),
      score1: score1.trim(),
      score2: score2.trim(),
      winner: winner.trim()
    };

    const nowStr = new Date().toISOString();
    await dbQuery(
      `UPDATE results 
       SET total_matches = $1, match_details = $2, submitted_by = $3, submitted_at = $4
       WHERE event_id = $5`,
      [currentDetails.length, JSON.stringify(currentDetails), user?.name || 'Event Coordinator', nowStr, eventId]
    );

    await addAuditLog(
      user?.name || 'Event Coordinator',
      user?.role || 'faculty',
      'UPDATE_MATCH_DETAILS',
      `Updated match at index ${matchIdx} for event ${eventId}`
    );

    res.json({ success: true, message: 'Match details updated successfully!' });
  } catch (error: any) {
    console.error('updateMatchDetailsByIndex error:', error);
    res.status(500).json({ success: false, message: 'Failed to update match details.' });
  }
};

export const deleteMatchDetailsByIndex = async (req: Request, res: Response): Promise<void> => {
  const { eventId, index } = req.params;
  const { user } = req.body;
  const matchIdx = parseInt(index as string, 10);

  try {
    const checkRes = await dbQuery('SELECT * FROM results WHERE event_id = $1', [eventId]);
    if (checkRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'No result record found for this event.' });
      return;
    }

    const row = checkRes.rows[0];
    if (row.is_locked) {
      res.status(403).json({ success: false, message: 'Result is locked. Cannot delete match details.' });
      return;
    }

    let currentDetails = typeof row.match_details === 'string' ? JSON.parse(row.match_details) : (row.match_details || []);
    if (matchIdx < 0 || matchIdx >= currentDetails.length) {
      res.status(400).json({ success: false, message: 'Invalid match index.' });
      return;
    }

    currentDetails.splice(matchIdx, 1);

    const nowStr = new Date().toISOString();
    await dbQuery(
      `UPDATE results 
       SET total_matches = $1, match_details = $2, submitted_by = $3, submitted_at = $4
       WHERE event_id = $5`,
      [currentDetails.length, JSON.stringify(currentDetails), user?.name || 'Event Coordinator', nowStr, eventId]
    );

    await addAuditLog(
      user?.name || 'Event Coordinator',
      user?.role || 'faculty',
      'DELETE_MATCH_DETAILS',
      `Deleted match at index ${matchIdx} for event ${eventId}`
    );

    res.json({ success: true, message: 'Match details deleted successfully!' });
  } catch (error: any) {
    console.error('deleteMatchDetailsByIndex error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete match details.' });
  }
};

export const finalizeMatchDetails = async (req: Request, res: Response): Promise<void> => {
  const { eventId } = req.params;
  const { user } = req.body;

  try {
    const checkRes = await dbQuery('SELECT * FROM results WHERE event_id = $1', [eventId]);
    if (checkRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'No match details found to finalize.' });
      return;
    }

    const row = checkRes.rows[0];
    const currentDetails = typeof row.match_details === 'string' ? JSON.parse(row.match_details) : (row.match_details || []);
    if (currentDetails.length === 0) {
      res.status(400).json({ success: false, message: 'Cannot finalize with zero matches logged.' });
      return;
    }

    await dbQuery(
      `UPDATE results 
       SET is_locked = TRUE, submitted_by = $1, submitted_at = $2
       WHERE event_id = $3`,
      [user?.name || 'Event Coordinator', new Date().toISOString(), eventId]
    );

    await addAuditLog(
      user?.name || 'Event Coordinator',
      user?.role || 'faculty',
      'FINALIZE_MATCH_DETAILS',
      `Finalized and locked results/match details for event ${eventId}`
    );

    res.json({ success: true, message: 'Match details finalized and locked successfully!' });
  } catch (error: any) {
    console.error('finalizeMatchDetails error:', error);
    res.status(500).json({ success: false, message: 'Failed to finalize match details.' });
  }
};
