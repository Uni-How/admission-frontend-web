import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import School from '@/models/School';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const school_id = searchParams.get('school_id');
    
    const query: any = {};
    
    if (school_id) {
      query.school_id = school_id;
    }
    
    if (region) {
      // Filter by the location of the MAIN campus
      query.campuses = { 
        $elemMatch: { 
          is_main: true, 
          'location.city': region 
        } 
      };
    }

    const schools = await School.find(query);
    return NextResponse.json(schools);
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
