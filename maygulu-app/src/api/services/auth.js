import { postJson } from '../client';

export const login = ({ emailUser, password }) => postJson('/auth/login', { emailUser, password });
export const register = ({ full_name, emailUser, password, faculties_id, department_id }) =>
  postJson('/auth/register', { full_name, emailUser, password, faculties_id, department_id });
