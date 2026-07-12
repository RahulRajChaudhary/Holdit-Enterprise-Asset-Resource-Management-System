import client from './client';

export async function listCategories() {
  const { data } = await client.get('/categories');
  return data.categories;
}

export async function createCategory(payload) {
  const { data } = await client.post('/categories', payload);
  return data.category;
}

export async function updateCategory(id, payload) {
  const { data } = await client.patch(`/categories/${id}`, payload);
  return data.category;
}
