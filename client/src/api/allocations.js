import client from './client';

export async function listAllocationsForAsset(assetId) {
  const { data } = await client.get(`/allocations/asset/${assetId}`);
  return data.allocations;
}

export async function allocateAsset(payload) {
  const { data } = await client.post('/allocations', payload);
  return data.allocation;
}

export async function returnAsset(payload) {
  const { data } = await client.post('/allocations/return', payload);
  return data.asset;
}

export async function requestTransfer(payload) {
  const { data } = await client.post('/allocations/transfer-requests', payload);
  return data.request;
}

export async function listTransferRequests(params = {}) {
  const { data } = await client.get('/allocations/transfer-requests', { params });
  return data.requests;
}

export async function decideTransfer(id, decision) {
  const { data } = await client.patch(`/allocations/transfer-requests/${id}`, { decision });
  return data.request;
}

export async function listOverdueAllocations() {
  const { data } = await client.get('/allocations/overdue');
  return data.allocations;
}

export async function listUpcomingReturns() {
  const { data } = await client.get('/allocations/upcoming-returns');
  return data.allocations;
}
