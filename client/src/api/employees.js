import client from './client';

export async function listEmployees() {
  const { data } = await client.get('/employees');
  return data.employees;
}

export async function updateEmployee(id, payload) {
  const { data } = await client.patch(`/employees/${id}`, payload);
  return data.employee;
}
