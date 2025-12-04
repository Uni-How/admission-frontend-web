import { NextRequest, NextResponse } from 'next/server'

// GET 請求處理
export async function GET(request: NextRequest) {
  return NextResponse.json({ method: 'GET' })
}

// POST 請求處理
export async function POST(request: NextRequest) {
  const body = await request.json()


  
  return NextResponse.json({ method: 'POST', data: body })
}