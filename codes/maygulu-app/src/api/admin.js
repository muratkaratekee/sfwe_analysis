import { getJson, postJson, putJson, del } from './client';

export const getUsers = () => getJson('/admin/users');
export const updateUser = (id, payload) => putJson(`/admin/users/${id}`, payload);
export const deleteUser = (id, adminUserId) => del(`/admin/users/${id}?admin_user_id=${adminUserId}`);
export const createFaculty = (payload) => postJson('/admin/faculties', payload);
export const updateFaculty = (id, payload) => putJson(`/admin/faculties/${id}`, payload);
export const createDepartment = (payload) => postJson('/admin/departments', payload);
export const updateDepartment = (id, payload) => putJson(`/admin/departments/${id}`, payload);
