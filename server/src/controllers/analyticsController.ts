import { Request, Response } from 'express';
import { dbQuery } from '../services/db';
import { EVENTS_CATALOG } from '../../../src/data/eventsCatalog';
import { FestEvent } from '../../../src/types';

export const getAnalyticsData = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Summary stats
    const instCountRes = await dbQuery('SELECT COUNT(*) FROM institutions');
    const partCountRes = await dbQuery('SELECT COUNT(*) FROM participants');
    const verifiedPartCountRes = await dbQuery("SELECT COUNT(*) FROM participants WHERE verification_status = 'VERIFIED'");
    const totalRevenueRes = await dbQuery("SELECT SUM(amount) FROM payments");

    const totalInstitutions = parseInt(instCountRes.rows[0].count, 10);
    const totalParticipants = parseInt(partCountRes.rows[0].count, 10);
    const verifiedParticipants = parseInt(verifiedPartCountRes.rows[0].count, 10);
    const totalRevenue = parseFloat(totalRevenueRes.rows[0].sum || '0');

    // 2. District distribution: count of participants per district
    const districtRes = await dbQuery(
      `SELECT COALESCE(i.district, 'Bengaluru Urban') as district, COUNT(p.id) as participants
       FROM participants p
       JOIN institutions i ON p.institution_id = i.id
       GROUP BY i.district`
    );
    const districtData = districtRes.rows.map((row: any) => ({
      district: row.district,
      participants: parseInt(row.participants, 10)
    }));

    // 3. Event Popularity: count of teams and participants per event catalog item
    const teamsCountRes = await dbQuery('SELECT event_id, COUNT(*) as count FROM teams GROUP BY event_id');
    const partsCountRes = await dbQuery('SELECT event_id, COUNT(*) as count FROM participants GROUP BY event_id');
    
    const eventPopularity = EVENTS_CATALOG.map((evt: FestEvent) => {
      const teamRow = teamsCountRes.rows.find((t: any) => t.event_id === evt.id);
      const partRow = partsCountRes.rows.find((p: any) => p.event_id === evt.id);
      return {
        eventName: evt.name,
        category: evt.category,
        teams: teamRow ? parseInt(teamRow.count, 10) : 0,
        participants: partRow ? parseInt(partRow.count, 10) : 0
      };
    });

    // 4. Category breakdown: Sports vs Cultural
    const categoryRes = await dbQuery(
      `SELECT e.category, COUNT(p.id) as count
       FROM participants p
       JOIN events e ON p.event_id = e.id
       GROUP BY e.category`
    );
    let sportsCount = 0;
    let culturalCount = 0;
    categoryRes.rows.forEach((row: any) => {
      if (row.category === 'SPORTS') {
        sportsCount = parseInt(row.count, 10);
      } else {
        culturalCount = parseInt(row.count, 10);
      }
    });

    // 5. Gender breakdown
    const genderRes = await dbQuery(
      `SELECT gender, COUNT(*) as count
       FROM participants
       GROUP BY gender`
    );
    let maleCount = 0;
    let femaleCount = 0;
    genderRes.rows.forEach((row: any) => {
      if (row.gender === 'Female') {
        femaleCount = parseInt(row.count, 10);
      } else if (row.gender === 'Male') {
        maleCount = parseInt(row.count, 10);
      }
    });

    // 6. Revenue & Registration Trend timeline from payments
    const trendRes = await dbQuery(
      `SELECT DATE(date) as day, COUNT(*) as count, SUM(amount) as revenue
       FROM payments
       WHERE date IS NOT NULL
       GROUP BY DATE(date)
       ORDER BY day ASC`
    );
    
    let cumulativeRegistrations = 0;
    let cumulativeRevenue = 0;
    
    let trendData = trendRes.rows.map((row: any) => {
      const dateVal = row.day ? new Date(row.day) : new Date();
      const dayStr = isNaN(dateVal.getTime()) ? 'Today' : dateVal.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      cumulativeRegistrations += parseInt(row.count || '0', 10);
      cumulativeRevenue += parseFloat(row.revenue || '0');
      return {
        date: dayStr,
        registrations: cumulativeRegistrations,
        revenue: cumulativeRevenue
      };
    });

    if (trendData.length === 0) {
      trendData = [
        { date: 'Jul 15', registrations: totalParticipants, revenue: totalRevenue }
      ];
    }

    res.json({
      success: true,
      summary: {
        totalInstitutions: totalInstitutions || 0,
        totalParticipants: totalParticipants || 0,
        verifiedParticipants: verifiedParticipants || 0,
        totalRevenue: totalRevenue || 0
      },
      districtData: districtData || [],
      eventPopularity: eventPopularity || [],
      categoryBreakdown: [
        { name: 'Sports', value: sportsCount || 0 },
        { name: 'Cultural', value: culturalCount || 0 }
      ],
      genderBreakdown: [
        { name: 'Male', value: maleCount || 0 },
        { name: 'Female', value: femaleCount || 0 }
      ],
      trendData
    });
  } catch (error: any) {
    console.error('getAnalyticsData error:', error);
    res.json({
      success: true,
      summary: { totalInstitutions: 0, totalParticipants: 0, verifiedParticipants: 0, totalRevenue: 0 },
      districtData: [],
      eventPopularity: [],
      categoryBreakdown: [{ name: 'Sports', value: 0 }, { name: 'Cultural', value: 0 }],
      genderBreakdown: [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }],
      trendData: []
    });
  }
};
