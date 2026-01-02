export interface ReceiptData {
  merchant?: string;
  date?: string;
  amount?: number;
  category?: string;
}

// Gunakan 'helloworld' untuk testing, atau daftar gratis di https://ocr.space/ocrapi untuk key sendiri
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY || 'helloworld'; 

export async function analyzeReceipt(base64Image: string): Promise<ReceiptData> {
  const formData = new FormData();
  formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': OCR_API_KEY,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage?.[0] || 'OCR Failed');
    }

    const parsedText = data.ParsedResults?.[0]?.ParsedText || '';
    return parseReceiptText(parsedText);

  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to analyze receipt');
  }
}

function parseReceiptText(text: string): ReceiptData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let merchant = lines[0]; // Asumsi baris pertama adalah nama toko
  let date: string | undefined;
  let amount: number | undefined;

  // 1. Cari Tanggal (Format: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
  const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{4}[-/]\d{1,2}[-/]\d{1,2})/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    // Coba parse tanggal
    try {
      const dateStr = dateMatch[0].replace(/\//g, '-');
      const parts = dateStr.split('-');
      // Basic check untuk format DD-MM-YYYY vs YYYY-MM-DD
      if (parts[0].length === 4) {
        date = new Date(dateStr).toISOString();
      } else {
        // Asumsi DD-MM-YYYY
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
      }
    } catch (e) {
      console.log('Date parse error', e);
    }
  }

  // 2. Cari Total Amount
  // Cari angka terbesar yang formatnya mirip uang (10.000, 50,000.00, dll)
  const moneyRegex = /[\d,.]+/g;
  const numbers: number[] = [];
  
  lines.forEach(line => {
    // Filter baris yang mengandung kata kunci harga/total seringkali membantu, 
    // tapi untuk simpelnya kita cari angka terbesar di struk.
    const matches = line.match(moneyRegex);
    if (matches) {
      matches.forEach(match => {
        // Bersihkan format uang (hapus titik/koma yang membingungkan)
        // Asumsi format Indonesia: 10.000 atau 10000. Abaikan desimal ,00
        let clean = match.replace(/[^0-9]/g, '');
        if (clean.length > 0) {
          const val = parseInt(clean);
          // Filter angka yang masuk akal (misal bukan tahun 2024, bukan no telp)
          if (val > 100 && val < 100000000 && val !== 2024 && val !== 2025) { 
            numbers.push(val);
          }
        }
      });
    }
  });

  if (numbers.length > 0) {
    // Ambil angka terbesar sebagai total (biasanya total adalah angka paling besar di struk)
    amount = Math.max(...numbers);
  }

  return {
    merchant,
    date,
    amount,
    category: 'Expense' // Default category, karena OCR biasa gabisa nebak konteks
  };
}
