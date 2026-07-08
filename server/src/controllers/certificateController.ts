import { Request, Response } from 'express';
import { dbQuery } from '../services/db';

export const getCertificateData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Filter ONLY VERIFIED participants
    const partsRes = await dbQuery("SELECT * FROM participants WHERE verification_status = 'VERIFIED'");
    const verifiedParticipants = partsRes.rows;

    const instsRes = await dbQuery('SELECT id, name FROM institutions');
    const institutions = instsRes.rows;

    const eventsRes = await dbQuery('SELECT id, name FROM events');
    const events = eventsRes.rows;

    const resultsRes = await dbQuery('SELECT * FROM results WHERE is_locked = true');
    const results = resultsRes.rows;

    const certificatesList = verifiedParticipants.map((part: any, idx: number) => {
      const inst = institutions.find((i: any) => i.id === part.institution_id);
      const event = events.find((e: any) => e.id === part.event_id);
      const result = results.find((r: any) => r.event_id === part.event_id);

      let certType: 'PARTICIPATION' | 'WINNER' | 'RUNNER_UP' | 'SECOND_RUNNER_UP' = 'PARTICIPATION';

      if (result) {
        if (result.winner_team_id === part.team_id) certType = 'WINNER';
        else if (result.runner_up_team_id === part.team_id) certType = 'RUNNER_UP';
        else if (result.second_runner_up_team_id === part.team_id) certType = 'SECOND_RUNNER_UP';
      }

      const code = `ANV-CERT-2026-${String(1000 + idx).padStart(4, '0')}`;

      return {
        id: `cert_${part.id}`,
        participantId: part.id,
        participantName: part.name,
        institutionName: inst ? inst.name : 'Christ PU Affiliate',
        eventName: event ? event.name : part.event_id,
        type: certType,
        chestNumber: part.chest_number || 'UNASSIGNED',
        issueDate: '2026-07-04',
        certificateCode: code
      };
    });

    res.json({ success: true, count: certificatesList.length, certificates: certificatesList });
  } catch (error: any) {
    console.error('getCertificateData error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve certificates.' });
  }
};
