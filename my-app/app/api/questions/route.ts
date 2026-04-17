import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import CryptoJS from 'crypto-js';

export const dynamic = 'force-dynamic';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string;

export async function GET() {
  try {
    const now = new Date();
    const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const yyyy = turkeyTime.getUTCFullYear();
    const mm = String(turkeyTime.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(turkeyTime.getUTCDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('game_date', formattedDate)
      .limit(14);

    if (error) {
      console.error('Veritabanı hatası:', error);
      return NextResponse.json({ error: 'Sorular alınamadı' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ questions: [] });
    }

    // `word` (cevap) kısmını algoritmamızla (AES) şifreliyoruz.
    const encryptedData = data.map((question: any) => ({
      ...question,
      word: CryptoJS.AES.encrypt(question.word, ENCRYPTION_KEY).toString()
    }));

    return NextResponse.json({ questions: encryptedData }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('API Çalışma Hatası:', err);
    return NextResponse.json({ error: 'Bir sorun oluştu' }, { status: 500 });
  }
}
