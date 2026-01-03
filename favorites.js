import { getJson, postJson, del } from './client';

// Kullanıcının favorilerini getir
export const getFavorites = async (userId) => {
  return getJson(`/favorites/${userId}`);
};

// Favori ekle
export const addFavorite = async (userId, thesisId) => {
  return postJson('/favorites', { user_id: userId, thesis_id: thesisId });
};

// Favori kaldır
export const removeFavorite = async (userId, thesisId) => {
  return del(`/favorites/${userId}/${thesisId}`);
};

// Favori durumunu kontrol et
export const checkFavorite = async (userId, thesisId) => {
  return getJson(`/favorites/${userId}/${thesisId}/check`);
};
