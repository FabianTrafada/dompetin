export interface ReceiptData {
  merchant?: string;
  date?: string;
  amount?: number;
  category?: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export async function analyzeReceipt(base64Image: string): Promise<ReceiptData> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key is missing. Please add EXPO_PUBLIC_GEMINI_API_KEY in your .env file');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Extract the merchant name, date, total amount, and category (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other) from this receipt. Return ONLY a raw JSON object (no markdown, no backticks) with keys: merchant, date (ISO format YYYY-MM-DD), amount (number), category."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${errorText}`);
  }

  const data = await response.json();
  
  try {
    const text = data.candidates[0].content.parts[0].text;
    // Clean up markdown if present (Gemini sometimes adds ```json ... ```)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse Gemini response:', data);
    throw new Error('Failed to parse receipt data');
  }
}
