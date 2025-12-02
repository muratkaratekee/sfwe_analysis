import { getJson } from '../client';

export const getFaculties = () => getJson('/faculties');
export const getDepartments = () => getJson('/departments');
export const getDepartmentsByFaculty = (facultyId) =>
  facultyId ? getJson(`/departments?faculty_id=${Number(facultyId)}`) : getJson('/departments');
export const getAdvisors = () => getJson('/advisors');
