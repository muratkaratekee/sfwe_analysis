import { API_BASE, getJson, postJson, putJson, del, postForm } from '../client';

// Listing & filters
export const getTheses = () => getJson('/theses');
export const getThesesByAdvisor = (advisorId) =>
  Number.isInteger(Number(advisorId)) ? getJson(`/theses?advisor_id=${Number(advisorId)}`) : getJson('/theses');
export const getThesesFiltered = (params = {}) => {
  const q = new URLSearchParams();
  if (Number.isInteger(Number(params.advisor_id))) q.set('advisor_id', String(Number(params.advisor_id)));
  if (Number.isInteger(Number(params.department_id))) q.set('department_id', String(Number(params.department_id)));
  if (Number.isInteger(Number(params.faculty_id))) q.set('faculty_id', String(Number(params.faculty_id)));
  if (Number.isInteger(Number(params.year))) q.set('year', String(Number(params.year)));
  if (Number.isInteger(Number(params.year_from))) q.set('year_from', String(Number(params.year_from)));
  if (Number.isInteger(Number(params.year_to))) q.set('year_to', String(Number(params.year_to)));
  if (typeof params.q === 'string' && params.q.trim() !== '') q.set('q', params.q.trim());
  if (typeof params.sort === 'string' && params.sort.trim() !== '') q.set('sort', params.sort.trim());
  const qs = q.toString();
  return getJson(qs ? `/theses?${qs}` : '/theses');
};

// Detail & CRUD
export const getThesis = (id) => getJson(`/theses/${id}`);
export const updateThesis = (id, payload) => putJson(`/theses/${id}`, payload);
export const deleteThesis = (id) => del(`/theses/${id}`);
export const createThesis = (formData) => postForm('/theses', formData);

// Files
export const buildFileUrl = (file_path) => `${API_BASE}/files/${encodeURIComponent(file_path)}`;
export const downloadThesisFile = (thesisId, filePath) => {
  const url = `${API_BASE}/theses/${thesisId}/files/${encodeURIComponent(filePath)}/download`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Comments
export const getComments = (thesisId) => getJson(`/theses/${thesisId}/comments`);
export const addComment = (thesisId, payload) => postJson(`/theses/${thesisId}/comments`, payload);
export const deleteComment = (commentId) => del(`/comments/${commentId}`);

// Citations
export const getCitations = (thesisId) => getJson(`/theses/${thesisId}/citations`);
export const addCitation = (thesisId, payload) => postJson(`/theses/${thesisId}/citations`, payload);
export const updateCitation = (citationId, payload) => putJson(`/citations/${citationId}`, payload);
export const deleteCitation = (citationId) => del(`/citations/${citationId}`);

// Analytics
export const getThesisDailyViews = (thesisId, days = 30) => getJson(`/theses/${thesisId}/analytics/views/daily?days=${encodeURIComponent(days)}`);
export const getThesisMonthlyViews = (thesisId, months = 12) => getJson(`/theses/${thesisId}/analytics/views/monthly?months=${encodeURIComponent(months)}`);
export const getThesisCitationsByYear = (thesisId) => getJson(`/theses/${thesisId}/analytics/citations/by-year`);
export const getThesisCitationsByType = (thesisId) => getJson(`/theses/${thesisId}/analytics/citations/by-type`);
export const getThesisCitationImpact = (thesisId) => getJson(`/theses/${thesisId}/analytics/citations/impact`);
export const recordThesisView = (thesisId) => postJson(`/theses/${thesisId}/view`, {});
