import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'error',
          message: 'DATABASE_URL environment variable is not set',
          env_check: {
            DATABASE_URL: 'NOT SET',
            OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
          }
        }),
      };
    }

    // Try to connect to database
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    
    // Try to query the grader schema
    const schemaCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'grader'
      ORDER BY table_name
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'healthy',
        message: 'Database connection successful',
        database: {
          connected: true,
          current_time: result[0].current_time,
          version: result[0].db_version,
        },
        schema: {
          tables: schemaCheck.map(t => t.table_name),
        },
        environment: {
          DATABASE_URL: 'SET (hidden)',
          OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
          NODE_VERSION: process.version,
        }
      }),
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        error_details: error instanceof Error ? error.stack : undefined,
        environment: {
          DATABASE_URL: process.env.DATABASE_URL ? 'SET (but connection failed)' : 'NOT SET',
          OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
        }
      }),
    };
  }
};

export { handler };
