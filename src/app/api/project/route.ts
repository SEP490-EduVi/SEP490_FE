/**
 * EduVi Mock API Route
 * ====================
 * 
 * GET /api/project - Returns the mock document
 * POST /api/project - Simulates creating/updating a document
 * 
 * BACKEND TEAM NOTES:
 * -------------------
 * This route handler demonstrates the expected API contract.
 * The real backend should implement these endpoints with the same
 * request/response structure.
 * 
 * Expected Response Format:
 * {
 *   "id": "string",
 *   "title": "string",
 *   "cards": ICard[],
 *   "activeCardId": "string",
 *   "createdAt": "ISO-8601 string",
 *   "updatedAt": "ISO-8601 string"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { emptyDocument } from '@/data/mock-data';
import { IDocument } from '@/types';

/**
 * GET /api/project
 * 
 * Fetches the current document/project data.
 * In production, this would fetch from a database.
 */
export async function GET(_request: NextRequest) {
  // Simulate network latency for realistic testing
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Return mock data
  return NextResponse.json(emptyDocument, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // CORS headers for frontend development
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}

/**
 * POST /api/project
 * 
 * Creates or updates a document.
 * Accepts the full document structure in the request body.
 * 
 * Request Body: IDocument (partial or full)
 * Response: Updated IDocument with new timestamps
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));

    // In a real implementation, this would:
    // 1. Validate the incoming data
    // 2. Save to database
    // 3. Return the saved document

    const updatedDocument: IDocument = {
      ...emptyDocument,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedDocument, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * OPTIONS /api/project
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
