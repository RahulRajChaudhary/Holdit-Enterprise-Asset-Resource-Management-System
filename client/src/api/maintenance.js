import client from './client';

export async function listMaintenanceForAsset(assetId) {
  const { data } = await client.get(`/maintenance/asset/${assetId}`);
  return data.requests;
}

export async function listMaintenanceRequests(params = {}) {
  const { data } = await client.get('/maintenance', { params });
  return data.requests;
}

export async function countActiveMaintenance() {
  const { data } = await client.get('/maintenance/count-active');
  return data.count;
}

export async function raiseMaintenanceRequest(payload) {
  const { data } = await client.post('/maintenance', payload);
  return data.request;
}

export async function decideMaintenanceRequest(id, decision) {
  const { data } = await client.patch(`/maintenance/${id}/decide`, { decision });
  return data.request;
}

export async function assignTechnician(id, technicianName) {
  const { data } = await client.patch(`/maintenance/${id}/assign-technician`, { technicianName });
  return data.request;
}

export async function startMaintenanceProgress(id) {
  const { data } = await client.patch(`/maintenance/${id}/start`);
  return data.request;
}

export async function resolveMaintenanceRequest(id) {
  const { data } = await client.patch(`/maintenance/${id}/resolve`);
  return data.request;
}
