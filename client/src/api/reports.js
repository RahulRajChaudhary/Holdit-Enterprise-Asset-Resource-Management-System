import client from './client';

export async function getReportSummary() {
  const { data } = await client.get('/reports/summary');
  return data;
}
