import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    // จำลองคำตอบจากระบบ
    const reply = `[SYSTEM_LOG]: ประมวลผลคำสั่ง "${message}" สำเร็จ... สถานะออนไลน์ 100%`;
    
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
