import { dbQuery } from '../services/db';
import { EVENTS_CATALOG } from '../../../src/data/eventsCatalog';
export const getAnalyticsData = async (req, res) => {
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
        const districtRes = await dbQuery(`SELECT COALESCE(i.district, 'Bengaluru Urban') as district, COUNT(p.id) as participants
       FROM participants p
       JOIN institutions i ON p.institution_id = i.id
       GROUP BY i.district`);
        const districtData = districtRes.rows.map((row) => ({
            district: row.district,
            participants: parseInt(row.participants, 10)
        }));
        // 3. Event Popularity: count of teams and participants per event catalog item
        const teamsCountRes = await dbQuery('SELECT event_id, COUNT(*) as count FROM teams GROUP BY event_id');
        const partsCountRes = await dbQuery('SELECT event_id, COUNT(*) as count FROM participants GROUP BY event_id');
        const eventPopularity = EVENTS_CATALOG.map((evt) => {
            const teamRow = teamsCountRes.rows.find((t) => t.event_id === evt.id);
            const partRow = partsCountRes.rows.find((p) => p.event_id === evt.id);
            return {
                eventName: evt.name,
                category: evt.category,
                teams: teamRow ? parseInt(teamRow.count, 10) : 0,
                participants: partRow ? parseInt(partRow.count, 10) : 0
            };
        });
        // 4. Category breakdown: Sports vs Cultural
        const categoryRes = await dbQuery(`SELECT e.category, COUNT(p.id) as count
       FROM participants p
       JOIN events e ON p.event_id = e.id
       GROUP BY e.category`);
        let sportsCount = 0;
        let culturalCount = 0;
        categoryRes.rows.forEach((row) => {
            if (row.category === 'SPORTS') {
                sportsCount = parseInt(row.count, 10);
            }
            else {
                culturalCount = parseInt(row.count, 10);
            }
        });
        // 5. Gender breakdown
        const genderRes = await dbQuery(`SELECT gender, COUNT(*) as count
       FROM participants
       GROUP BY gender`);
        let maleCount = 0;
        let femaleCount = 0;
        genderRes.rows.forEach((row) => {
            if (row.gender === 'Female') {
                femaleCount = parseInt(row.count, 10);
            }
            else if (row.gender === 'Male') {
                maleCount = parseInt(row.count, 10);
            }
        });
        // 6. Revenue & Registration Trend timeline from payments
        const trendRes = await dbQuery(`SELECT DATE(date) as day, COUNT(*) as count, SUM(amount) as revenue
       FROM payments
       GROUP BY DATE(date)
       ORDER BY day ASC`);
        let cumulativeRegistrations = 0;
        let cumulativeRevenue = 0;
        let trendData = trendRes.rows.map((row) => {
            const dateVal = new Date(row.day);
            const dayStr = dateVal.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
            cumulativeRegistrations += parseInt(row.count, 10);
            cumulativeRevenue += parseFloat(row.revenue);
            return {
                date: dayStr,
                registrations: cumulativeRegistrations,
                revenue: cumulativeRevenue
            };
        });
        if (trendData.length === 0) {
            trendData = [
                { date: 'Jun 15', registrations: 1, revenue: 4000 },
                { date: 'Jun 16', registrations: 2, revenue: 6500 },
                { date: 'Jun 17', registrations: 3, revenue: 8700 },
                { date: 'Jun 18', registrations: 4, revenue: 11200 },
                { date: 'Jul 04', registrations: 4, revenue: 11200 }
            ];
        }
        res.json({
            success: true,
            summary: {
                totalInstitutions,
                totalParticipants,
                verifiedParticipants,
                totalRevenue
            },
            districtData,
            eventPopularity,
            categoryBreakdown: [
                { name: 'Sports', value: sportsCount },
                { name: 'Cultural', value: culturalCount }
            ],
            genderBreakdown: [
                { name: 'Male', value: maleCount },
                { name: 'Female', value: femaleCount }
            ],
            trendData
        });
    }
    catch (error) {
        console.error('getAnalyticsData error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve analytics data.' });
    }
};
