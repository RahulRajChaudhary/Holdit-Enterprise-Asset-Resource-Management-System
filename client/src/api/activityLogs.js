import client from './client';

export async function listActivityLogs() {
  const { data } = await client.get('/activity-logs');
  return data.logs;
}
