import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import School from '@/models/School';

// Helper to map cities to regions (same as in Python script)
const REGION_MAPPING: { [key: string]: string[] } = {
  "北北基": ["臺北市", "新北市", "基隆市"],
  "桃竹苗": ["桃園市", "新竹縣", "新竹市", "苗栗縣"],
  "中彰投": ["臺中市", "彰化縣", "南投縣"],
  "雲嘉南": ["雲林縣", "嘉義縣", "嘉義市", "臺南市"],
  "高屏": ["高雄市", "屏東縣"],
  "宜花東": ["宜蘭縣", "花蓮縣", "臺東縣"],
  "離島": ["澎湖縣", "金門縣", "連江縣"]
};

function getRegion(city: string): string {
  for (const [region, cities] of Object.entries(REGION_MAPPING)) {
    if (cities.includes(city)) {
      return region;
    }
  }
  return "其他";
}

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

    // Fetch schools
    const schools = await School.find(query);

    // Fetch Metadata (Global, not filtered by query, to show all options)
    // Using distinct to get unique values from the entire collection
    const academic_groups = await School.distinct('departments.academic_group');
    const colleges = await School.distinct('departments.college');
    const cities = await School.distinct('campuses.location.city');

    // Calculate regions from cities
    const regions = Array.from(new Set(cities.map((city: string) => getRegion(city)))).sort();

    // Sort metadata
    academic_groups.sort();
    colleges.sort();
    cities.sort();

    return NextResponse.json({
      metadata: {
        academic_groups,
        colleges,
        regions,
        cities
      },
      schools
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
