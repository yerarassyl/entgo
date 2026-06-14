export const mobileHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

export function mobileJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: { ...mobileHeaders, ...init?.headers },
  });
}

export function mobileOptions() {
  return new Response(null, { status: 204, headers: mobileHeaders });
}

