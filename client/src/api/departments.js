import client from './client';

export async function listDepartments() {
  const { data } = await client.get('/departments');
  return data.departments;
}

export async function createDepartment(payload) {
  const { data } = await client.post('/departments', payload);
  return data.department;
}

export async function updateDepartment(id, payload) {
  const { data } = await client.patch(`/departments/${id}`, payload);
  return data.department;
}
