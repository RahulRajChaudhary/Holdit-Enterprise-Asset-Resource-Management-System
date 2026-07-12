import client from './client';

export async function listAssets(params = {}) {
  const { data } = await client.get('/assets', { params });
  return data.assets;
}

export async function getAsset(id) {
  const { data } = await client.get(`/assets/${id}`);
  return data.asset;
}

export async function createAsset(payload) {
  const { data } = await client.post('/assets', payload);
  return data.asset;
}

export async function updateAsset(id, payload) {
  const { data } = await client.patch(`/assets/${id}`, payload);
  return data.asset;
}
