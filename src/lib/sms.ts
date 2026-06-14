import "server-only";

export async function sendSms(phone: string, message: string) {
  const url = process.env.SMS_SEND_URL;
  const apiKey = process.env.SMS_API_KEY;
  if (!url || !apiKey) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, message }),
  });
  if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
  return true;
}
