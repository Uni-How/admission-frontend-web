import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import School from '@/models/School';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Basic validation: ensure body is an array
    if (!Array.isArray(body) && !body.school_id) {
       return NextResponse.json({ status: 'error', message: 'Invalid data format. Expected array or single object.' }, { status: 400 });
    }
    
    const data = Array.isArray(body) ? body : [body];

    await School.deleteMany({});
    const res = await School.insertMany(data);
    
    return NextResponse.json({ count: res.length, status: 'success' });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
