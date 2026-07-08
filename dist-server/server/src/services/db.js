import pg from 'pg';
const { Pool, Client } = pg;
import dotenv from 'dotenv';
import { EVENTS_CATALOG } from '../../../src/data/eventsCatalog';
import { INITIAL_USERS } from '../../../src/data/initialData';
dotenv.config();
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Mervin@0206@localhost:5432/AnveshaDB';
// Configure pool to connect specifically to AnveshaDB
export const pool = new Pool({
    connectionString
});
export const dbQuery = async (text, params = []) => {
    return await pool.query(text, params);
};
export const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
};
export const addAuditLog = async (user, role, action, details) => {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    await dbQuery(`INSERT INTO audit_logs (id, timestamp, user_name, role, action, details) 
     VALUES ($1, $2, $3, $4, $5, $6)`, [id, timestamp, user, role, action, details]);
};
const getPostgresConnectionStr = (dbUrl) => {
    const lastSlashIndex = dbUrl.lastIndexOf('/');
    if (lastSlashIndex === -1) {
        return dbUrl;
    }
    return dbUrl.substring(0, lastSlashIndex + 1) + 'postgres';
};
export const initDb = async () => {
    console.log('Ensuring PostgreSQL Database "AnveshaDB" exists...');
    // 1. Connect to default 'postgres' database to check / create AnveshaDB
    const adminConnectionStr = getPostgresConnectionStr(connectionString);
    const adminClient = new Client({ connectionString: adminConnectionStr });
    try {
        await adminClient.connect();
        const checkDb = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'AnveshaDB'");
        if (checkDb.rows.length === 0) {
            console.log('Creating database AnveshaDB...');
            await adminClient.query('CREATE DATABASE "AnveshaDB"');
        }
    }
    catch (err) {
        console.error('Failed checking/creating database "AnveshaDB" via admin connection:', err);
        throw err;
    }
    finally {
        await adminClient.end();
    }
    console.log('Initializing Database Schema inside "AnveshaDB"...');
    try {
        // 2. Create tables in proper dependency order
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        min_team_size INT NOT NULL,
        max_team_size INT NOT NULL,
        registration_fee NUMERIC(12, 2) NOT NULL,
        description TEXT NOT NULL,
        rules JSONB NOT NULL DEFAULT '[]'::jsonb,
        eligibility TEXT NOT NULL
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        event_id VARCHAR(100) REFERENCES events(id) ON DELETE SET NULL
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS bank_payments (
        id VARCHAR(100) PRIMARY KEY,
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        institution_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        amount NUMERIC(12, 2) NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) NOT NULL,
        registration_id VARCHAR(100),
        invitation_sent BOOLEAN NOT NULL DEFAULT FALSE,
        invitation_sent_at TIMESTAMP WITH TIME ZONE,
        principal_name VARCHAR(255),
        event_name VARCHAR(255),
        address TEXT
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS institutions (
        id VARCHAR(100) PRIMARY KEY,
        registration_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        principal_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        district VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        pincode VARCHAR(50) NOT NULL,
        school_contact_number VARCHAR(100) NOT NULL,
        school_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(100) PRIMARY KEY,
        institution_id VARCHAR(100) REFERENCES institutions(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        govt_id_proof VARCHAR(255) NOT NULL
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(100) PRIMARY KEY,
        registration_id VARCHAR(100) NOT NULL,
        institution_id VARCHAR(100) REFERENCES institutions(id) ON DELETE CASCADE,
        event_id VARCHAR(100) REFERENCES events(id) ON DELETE CASCADE,
        team_name VARCHAR(100) NOT NULL,
        captain_id VARCHAR(100),
        coach_name VARCHAR(255),
        mentor_name VARCHAR(255),
        status VARCHAR(50) NOT NULL
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS participants (
        id VARCHAR(100) PRIMARY KEY,
        registration_id VARCHAR(100) NOT NULL,
        institution_id VARCHAR(100) REFERENCES institutions(id) ON DELETE CASCADE,
        team_id VARCHAR(100) REFERENCES teams(id) ON DELETE CASCADE,
        event_id VARCHAR(100) REFERENCES events(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        gender VARCHAR(50) NOT NULL,
        dob VARCHAR(50) NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        section VARCHAR(100) NOT NULL,
        phone VARCHAR(100),
        email VARCHAR(255),
        govt_id_proof VARCHAR(255) NOT NULL,
        emergency_contact VARCHAR(255) NOT NULL,
        medical_info TEXT,
        chest_number VARCHAR(100),
        verification_status VARCHAR(50) NOT NULL,
        jersey_number VARCHAR(50),
        roster_status VARCHAR(50),
        check_in_status VARCHAR(50)
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(100) PRIMARY KEY,
        registration_id VARCHAR(100) NOT NULL,
        institution_id VARCHAR(100) REFERENCES institutions(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        transaction_id VARCHAR(100) NOT NULL,
        receipt_number VARCHAR(100) NOT NULL,
        payment_proof_url TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS verifications (
        id VARCHAR(100) PRIMARY KEY,
        registration_id VARCHAR(100) NOT NULL,
        institution_id VARCHAR(100) REFERENCES institutions(id) ON DELETE CASCADE,
        verified_by VARCHAR(255) NOT NULL,
        verified_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) NOT NULL,
        remarks TEXT
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS hospitality (
        id VARCHAR(100) PRIMARY KEY,
        institution_id VARCHAR(100) REFERENCES institutions(id) ON DELETE CASCADE,
        arrival_status VARCHAR(50) NOT NULL,
        arrival_time TIMESTAMP WITH TIME ZONE,
        accommodation_hall VARCHAR(255),
        food_preference VARCHAR(100) NOT NULL,
        special_requirements TEXT,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
        await dbQuery('DROP TABLE IF EXISTS fixtures CASCADE');
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS fixtures (
        id VARCHAR(100) PRIMARY KEY,
        event_id VARCHAR(100) REFERENCES events(id) ON DELETE CASCADE,
        round VARCHAR(255) NOT NULL,
        team_a_id VARCHAR(100),
        team_b_id VARCHAR(100),
        team_a_name VARCHAR(255) NOT NULL,
        team_b_name VARCHAR(255) NOT NULL,
        scheduled_time VARCHAR(100) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        score_a INT DEFAULT 0,
        score_b INT DEFAULT 0,
        judge_scores JSONB DEFAULT '{}'::jsonb,
        winner_team_id VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        remarks TEXT,
        sports_stats JSONB DEFAULT '{}'::jsonb,
        cultural_judges JSONB DEFAULT '{}'::jsonb,
        debate_stats JSONB DEFAULT '{}'::jsonb,
        treasure_hunt_stats JSONB DEFAULT '{}'::jsonb
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS results (
        id VARCHAR(100) PRIMARY KEY,
        event_id VARCHAR(100) UNIQUE REFERENCES events(id) ON DELETE CASCADE,
        winner_team_id VARCHAR(100),
        winner_team_name VARCHAR(255) NOT NULL,
        winner_institution_name VARCHAR(255) NOT NULL,
        runner_up_team_id VARCHAR(100),
        runner_up_team_name VARCHAR(255),
        runner_up_institution_name VARCHAR(255),
        second_runner_up_team_id VARCHAR(100),
        second_runner_up_team_name VARCHAR(255),
        second_runner_up_institution_name VARCHAR(255),
        submitted_by VARCHAR(255) NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_locked BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS edit_requests (
        id VARCHAR(100) PRIMARY KEY,
        event_id VARCHAR(100) REFERENCES events(id) ON DELETE CASCADE,
        faculty_name VARCHAR(255) NOT NULL,
        faculty_id VARCHAR(100) NOT NULL,
        reason TEXT NOT NULL,
        requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) NOT NULL,
        admin_remarks TEXT
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS certificates (
        id VARCHAR(100) PRIMARY KEY,
        participant_id VARCHAR(100) REFERENCES participants(id) ON DELETE CASCADE,
        participant_name VARCHAR(255) NOT NULL,
        institution_name VARCHAR(255) NOT NULL,
        event_name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        chest_number VARCHAR(100) NOT NULL,
        issue_date VARCHAR(100) NOT NULL,
        certificate_code VARCHAR(100) UNIQUE NOT NULL
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT NOT NULL
      );
    `);
        await dbQuery(`
      CREATE TABLE IF NOT EXISTS event_states (
        event_id VARCHAR(100) PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
        venue VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        delay_minutes INT NOT NULL DEFAULT 0,
        delay_reason TEXT,
        attendance_checked BOOLEAN NOT NULL DEFAULT FALSE,
        officials JSONB NOT NULL DEFAULT '[]'::jsonb
      );
    `);
        // 3. SEEDING logic with UPSERT for catalog events
        console.log('Synchronizing events catalog...');
        for (const e of EVENTS_CATALOG) {
            await dbQuery(`INSERT INTO events (id, name, category, type, min_team_size, max_team_size, registration_fee, description, rules, eligibility)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           type = EXCLUDED.type,
           min_team_size = EXCLUDED.min_team_size,
           max_team_size = EXCLUDED.max_team_size,
           registration_fee = EXCLUDED.registration_fee,
           description = EXCLUDED.description,
           rules = EXCLUDED.rules,
           eligibility = EXCLUDED.eligibility`, [e.id, e.name, e.category, e.type, e.minTeamSize, e.maxTeamSize, e.registrationFee, e.description, JSON.stringify(e.rules), e.eligibility]);
        }
        // Remove old unsplit event
        await dbQuery("DELETE FROM events WHERE id = 'sports_tug_of_war'");
        // Remove old unsplit user first to free up the username
        await dbQuery("DELETE FROM users WHERE id = 'usr_tugofwar'");
        // Seed users with UPSERT
        console.log('Synchronizing user roles...');
        for (const u of INITIAL_USERS) {
            await dbQuery(`INSERT INTO users (id, username, name, role, email, event_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           email = EXCLUDED.email,
           event_id = EXCLUDED.event_id`, [u.id, u.username, u.name, u.role, u.email, u.eventId || null]);
        }
        console.log('PostgreSQL Database Initialization complete.');
    }
    catch (error) {
        console.error('Failed to initialize PostgreSQL Database:', error);
        throw error;
    }
};
