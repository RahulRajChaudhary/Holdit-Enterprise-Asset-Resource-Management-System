import client from './client';

export async function listAuditCycles() {
  const { data } = await client.get('/audits');
  return data.cycles;
}

export async function getAuditCycle(id) {
  const { data } = await client.get(`/audits/${id}`);
  return data.cycle;
}

export async function createAuditCycle(payload) {
  const { data } = await client.post('/audits', payload);
  return data.cycle;
}

export async function markAuditItem(cycleId, assetId, verification) {
  const { data } = await client.patch(`/audits/${cycleId}/items`, { assetId, verification });
  return data.cycle;
}

export async function closeAuditCycle(id) {
  const { data } = await client.patch(`/audits/${id}/close`);
  return data.cycle;
}
