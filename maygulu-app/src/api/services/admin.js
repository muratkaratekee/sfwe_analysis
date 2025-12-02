import { getJson, postJson, putJson, del } from '../client';

export const getUsers = () => getJson('/admin/users');
export const updateUser = (id, payload) => putJson(`/admin/users/${id}`, payload);
export const deleteUser = (id) => del(`/admin/users/${id}`);
export const createFaculty = (name) => postJson('/admin/faculties', { name });
export const createDepartment = (name, faculty_id) => postJson('/admin/departments', { name, faculty_id });
