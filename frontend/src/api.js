import axios from "axios";

// Smart backend URL detection with optional override
const getBackendUrl = () => {
  // Allow manual override for LAN setups where the UI runs on localhost
  try {
    const override = localStorage.getItem('backendUrl');
    if (override) {
      // Validate a bit by constructing URL
      const u = new URL(override);
      return `${u.protocol}//${u.host}`;
    }
  } catch {}

  // If page is loaded over HTTPS, prefer same-origin to leverage reverse proxy (e.g., Caddy)
  if (window.location.protocol === 'https:') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  // If we're running on localhost (same machine), use localhost backend default
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // In development with proxy, use empty string for relative URLs
    if (window.location.port === '3000') {
      return "";  // Use proxy
    }
    return "http://localhost:8000";
  }

  // If we're running on port 3000 (React dev server), use proxy regardless of hostname
  if (window.location.port === '3000') {
    return "";  // Use proxy
  }

  // Otherwise, use LAN hostname with port 8000 for direct backend access over HTTP
  return `http://${window.location.hostname}:8000`;
};

// Named helper exports for managing backend URL override from the UI
export const getBackendBaseUrl = () => BASE_URL;
export const getBackendUrlOverride = () => {
  try { return localStorage.getItem('backendUrl') || ''; } catch { return ''; }
};
export const setBackendUrlOverride = (url) => {
  if (!url) return;
  // Basic validation
  const parsed = new URL(url);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error('URL must start with http:// or https://');
  }
  localStorage.setItem('backendUrl', `${parsed.protocol}//${parsed.host}`);
};
export const clearBackendUrlOverride = () => {
  try { localStorage.removeItem('backendUrl'); } catch {}
};

const BASE_URL = getBackendUrl();
const API = `${BASE_URL}/api`;

// Create axios instance with interceptors
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      localStorage.removeItem('token');
      window.location.reload(); // Redirect to login
    }
    return Promise.reject(error);
  }
);

// Function to set auth token
const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

export default {
  // Authentication methods
  setAuthToken,
  // Also expose a way to read the resolved base URL from consumers of the default export
  get baseUrl() { return BASE_URL; },
  
  login: async (username, password) => {
    const res = await axiosInstance.post(`${API}/auth/login`, {
      username,
      password
    });
    return res;
  },

  getCurrentUser: async () => {
    const res = await axiosInstance.get(`${API}/auth/me`);
    return res;
  },

  register: async (userData) => {
    const res = await axiosInstance.post(`${API}/auth/register`, userData);
    return res;
  },

  // User Management (Admin only)
  getUsers: async () => {
    const res = await axiosInstance.get(`${API}/auth/users`);
    return res.data;
  },

  getUser: async (userId) => {
    const res = await axiosInstance.get(`${API}/auth/users/${userId}`);
    return res.data;
  },

  updateUser: async (userId, userData) => {
    const res = await axiosInstance.put(`${API}/auth/users/${userId}`, userData);
    return res.data;
  },

  deleteUser: async (userId) => {
    const res = await axiosInstance.delete(`${API}/auth/users/${userId}`);
    return res.data;
  },

  // Schedules
  getSchedules: async () => {
    const res = await axiosInstance.get(`${API}/schedule/?_t=${Date.now()}`);
    return res.data;
  },

  updateSchedule: async (id, scheduleData) => {
    const res = await axiosInstance.put(`${API}/schedule/${id}`, scheduleData);
    return res.data;
  },

  getScheduleDays: async (scheduleId) => {
    const res = await axiosInstance.get(`${API}/schedule/${scheduleId}/days`);
    return res.data;
  },

  // Bell Events
  getBellEventsByDay: async (dayId) => {
    const res = await axiosInstance.get(`${API}/schedule/days/${dayId}/events`);
    return res.data;
  },

  getBellEvents: async () => {
    const res = await axiosInstance.get(`${API}/schedule/events`);
    return res.data;
  },

  createBellEvent: async (event) => {
    const res = await axiosInstance.post(`${API}/schedule/events`, event);
    return res.data;
  },

  // COPY a bell event to other days
  copyBellEvent: async (eventData) => {
    const res = await axiosInstance.post(`${API}/schedule/events/copy`, eventData);
    return res.data;
  },

  // UPDATE a bell event
  updateBellEvent: async (eventId, event) => {
    const res = await axiosInstance.put(`${API}/schedule/events/${eventId}`, event);
    return res.data;
  },

  // DELETE a bell event
  deleteBellEvent: async (eventId) => {
    const res = await axiosInstance.delete(`${API}/schedule/events/${eventId}`);
    return res.data;
  },

  // DELETE all similar bell events (same description and time across all days)
  deleteSimilarBellEvents: async (eventId) => {
    const res = await axiosInstance.delete(`${API}/schedule/events/similar/${eventId}`);
    return res.data;
  },

  // Special Schedules
  createSpecialSchedule: async (scheduleData) => {
    const res = await axiosInstance.post(`${API}/schedule/special/`, scheduleData);
    return res.data;
  },

  getSpecialSchedules: async (startDate = null, endDate = null) => {
    let url = `${API}/schedule/special/`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('_t', Date.now()); // Cache buster
    url += `?${params.toString()}`;
    const res = await axiosInstance.get(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return res.data;
  },

  getSpecialSchedule: async (id) => {
    const res = await axiosInstance.get(`${API}/schedule/special/${id}`);
    return res.data;
  },

  deleteSpecialSchedule: async (id) => {
    const res = await axiosInstance.delete(`${API}/schedule/special/${id}`);
    return res.data;
  },

  copySpecialSchedule: async (specialScheduleId, newName, newDescription = null) => {
    const res = await axiosInstance.post(`${API}/schedule/special/${specialScheduleId}/copy`, {
      name: newName,
      description: newDescription
    });
    return res.data;
  },

  scheduleSpecialEvent: async (specialScheduleId, date) => {
    const res = await axiosInstance.post(`${API}/schedule/special/${specialScheduleId}/schedule`, {
      special_schedule_id: specialScheduleId,
      date: date
    });
    return res.data;
  },

  activateSpecialSchedule: async (specialScheduleId, targetDate) => {
    console.log('=== activateSpecialSchedule API call ===');
    console.log('specialScheduleId:', specialScheduleId, 'type:', typeof specialScheduleId);
    console.log('targetDate:', targetDate, 'type:', typeof targetDate);
    console.log('Request payload:', {
      special_schedule_id: specialScheduleId,
      target_date: targetDate
    });
    
    const res = await axiosInstance.post(`${API}/schedule/special/activate`, {
      special_schedule_id: specialScheduleId,
      target_date: targetDate
    });
    
    console.log('API response:', res.data);
    return res.data;
  },

  activateSpecialScheduleForDay: async (specialScheduleId, dayOfWeek) => {
    const res = await axiosInstance.post(`${API}/schedule/special/activate-day`, {
      special_schedule_id: specialScheduleId,
      day_of_week: dayOfWeek
    });
    return res.data;
  },

  deactivateSpecialScheduleForDay: async (specialScheduleId, dayOfWeek) => {
    const res = await axiosInstance.post(`${API}/schedule/special/deactivate-day`, {
      special_schedule_id: specialScheduleId,
      day_of_week: dayOfWeek
    });
    return res.data;
  },

  scheduleSpecialScheduleForDate: async (specialScheduleId, targetDate) => {
    console.log('=== scheduleSpecialScheduleForDate API call ===');
    console.log('specialScheduleId:', specialScheduleId, 'type:', typeof specialScheduleId);
    console.log('targetDate:', targetDate, 'type:', typeof targetDate);
    console.log('Request payload:', {
      special_schedule_id: specialScheduleId,
      target_date: targetDate
    });
    
    const res = await axiosInstance.post(`${API}/schedule/special/schedule-date`, {
      special_schedule_id: specialScheduleId,
      target_date: targetDate
    });
    
    console.log('API response:', res.data);
    return res.data;
  },

  unscheduleSpecialScheduleForDate: async (targetDate) => {
    const res = await axiosInstance.post(`${API}/schedule/special/unschedule-date`, {
      target_date: targetDate
    });
    return res.data;
  },

  // Special schedule days and events
  createSpecialScheduleDay: async (specialScheduleId, dayData) => {
    const res = await axiosInstance.post(`${API}/schedule/special/${specialScheduleId}/days`, dayData);
    return res.data;
  },

  getSpecialScheduleDays: async (specialScheduleId) => {
    const res = await axiosInstance.get(`${API}/schedule/special/${specialScheduleId}/days`);
    return res.data;
  },

  createSpecialBellEvent: async (specialScheduleId, eventData) => {
    const res = await axiosInstance.post(`${API}/schedule/special/${specialScheduleId}/events`, eventData);
    return res.data;
  },

  getSpecialBellEventsByDay: async (specialDayId) => {
    const res = await axiosInstance.get(`${API}/schedule/special/days/${specialDayId}/events`);
    return res.data;
  },

  getSpecialBellEvents: async (specialScheduleId) => {
    const res = await axiosInstance.get(`${API}/schedule/special/${specialScheduleId}/events`);
    return res.data;
  },

  deleteSpecialBellEvent: async (eventId) => {
    const res = await axiosInstance.delete(`${API}/schedule/special/events/${eventId}`);
    return res.data;
  },

  updateSpecialBellEvent: async (eventId, eventData) => {
    const res = await axiosInstance.put(`${API}/schedule/special/events/${eventId}`, eventData);
    return res.data;
  },

  copySpecialBellEvent: async (eventId, targetDayIds) => {
    const res = await axiosInstance.post(`${API}/schedule/special/events/${eventId}/copy`, {
      target_day_ids: targetDayIds
    });
    return res.data;
  },

  // Sounds
  getAudioFiles: async () => {
    const res = await axiosInstance.get(`${API}/sounds/`);
    return res.data;
  },

  uploadSound: async (formData) => {
    const res = await axiosInstance.post(`${API}/sounds/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  deleteSound: async (soundId) => {
    const res = await axiosInstance.delete(`${API}/sounds/${soundId}`);
    return res.data;
  },

  updateSound: async (soundId, soundData) => {
    const formData = new FormData();
    if (soundData.name !== undefined) formData.append('name', soundData.name);
    if (soundData.description !== undefined) formData.append('description', soundData.description);
    if (soundData.tags !== undefined) formData.append('tags', soundData.tags);
    if (soundData.type !== undefined) formData.append('type', soundData.type);
    
    const res = await axiosInstance.put(`${API}/sounds/${soundId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  playSound: async (soundId) => {
    const res = await axiosInstance.post(`${API}/sounds/${soundId}/play`);
    return res.data;
  },

  playAudio: async (soundId) => {
    const res = await axiosInstance.post(`${API}/sounds/${soundId}/play`);
    return res.data;
  },

  stopSound: async (soundId) => {
    const res = await axiosInstance.post(`${API}/sounds/${soundId}/stop`);
    return res.data;
  },

  stopAudio: async () => {
    const res = await axiosInstance.post(`${API}/audio/stop`);
    return res.data;
  },

  stopAllAudio: async () => {
    const res = await axiosInstance.post(`${API}/audio/stop-all`);
    return res.data;
  },

  getAudioSettings: async () => {
    const res = await axiosInstance.get(`${API}/audio/settings`);
    return res.data;
  },

  saveAudioSettings: async (settings) => {
    const res = await axiosInstance.post(`${API}/audio/settings`, settings);
    return res.data;
  },

  getAudioOutputs: async () => {
    const res = await axiosInstance.get(`${API}/audio/outputs`);
    return res.data;
  },

  getAudioInputs: async () => {
    const res = await axiosInstance.get(`${API}/audio/inputs`);
    return res.data;
  },

  uploadAudioFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post(`${API}/sounds/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // GET next event
  getNextEvent: async () => {
    const res = await axiosInstance.get(`${API}/schedule/next`);
    return res.data;
  },

  // GET system status
  getSystemStatus: async () => {
    const res = await axiosInstance.get(`${BASE_URL}/api/system/status`);
    return res.data;
  },

  // Mute all schedules
  muteAllSchedules: async (muted) => {
    const res = await axiosInstance.post(`${API}/schedule/mute-all`, { mute: muted });
    return res.data;
  },

  // TTS
  generateTTS: async (text, voiceOrLang = null) => {
    const form = new FormData();
    form.append("text", text);
    if (voiceOrLang) {
      // Send both for compatibility; backend will prioritize voice_id if it matches
      form.append("voice_id", voiceOrLang);
      form.append("language", voiceOrLang);
    }
    const res = await axiosInstance.post(`${API}/tts/announce`, form, { timeout: 180000 });
    return res.data;
  },

  getAvailableVoices: async () => {
    const res = await axiosInstance.get(`${API}/tts/voices`);
    return res.data;
  },

  detectLanguage: async (text) => {
    const form = new FormData();
    form.append("text", text);
    const res = await axiosInstance.post(`${API}/tts/detect-language`, form);
    return res.data;
  },

  getTTSStatus: async () => {
    const res = await axiosInstance.get(`${API}/tts/status`);
    return res.data;
  },

  cleanupTTS: async () => {
    const res = await axiosInstance.post(`${API}/tts/cleanup`);
    return res.data;
  },

  cleanupVoices: async () => {
    const res = await axiosInstance.post(`${API}/tts/cleanup-voices`);
    return res.data;
  },

  getLanguages: async () => {
    const res = await axiosInstance.get(`${API}/tts/languages`);
    return res.data;
  },

  downloadVoice: async (voiceId) => {
    const form = new FormData();
    form.append("voice_id", voiceId);
    const res = await axiosInstance.post(`${API}/tts/download-voice`, form);
    return res.data;
  },

  removeVoice: async (voiceId) => {
    const form = new FormData();
    form.append("voice_id", voiceId);
    const res = await axiosInstance.post(`${API}/tts/remove-voice`, form);
    return res.data;
  },


  toggleMockMode: async (mockMode) => {
    const form = new FormData();
    form.append("mock_mode", mockMode);
    const res = await axiosInstance.post(`${API}/tts/toggle-mock-mode`, form);
    return res.data;
  },

  // Admin functions (with authentication)
  getAdminSettings: async () => {
    const res = await axiosInstance.get(`${BASE_URL}/api/admin/settings`);
    return res.data;
  },

  saveAdminSettings: async (settings) => {
    const res = await axiosInstance.post(`${BASE_URL}/api/admin/settings`, settings);
    return res.data;
  },

  uploadLogo: async (formData) => {
    const res = await axiosInstance.post(`${BASE_URL}/api/admin/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  createBackup: async () => {
    const res = await axiosInstance.post(`${BASE_URL}/api/admin/backup`);
    return res.data;
  },

  listBackups: async () => {
    const res = await axiosInstance.get(`${BASE_URL}/api/admin/backups`);
    return res.data;
  },

  restoreBackup: async (backupFilename) => {
    const res = await axiosInstance.post(`${BASE_URL}/api/admin/backup/restore/${backupFilename}`);
    return res.data;
  },

  deleteBackup: async (backupFilename) => {
    const res = await axiosInstance.delete(`${BASE_URL}/api/admin/backup/${backupFilename}`);
    return res.data;
  },

  getBackupStatus: async () => {
    const res = await axiosInstance.get(`${BASE_URL}/api/admin/backup/status`);
    return res.data;
  },

  downloadBackup: async (backupFilename) => {
    const res = await axiosInstance.get(`${BASE_URL}/api/admin/backup/download/${backupFilename}`, {
      responseType: 'blob'
    });
    return res;
  },

  uploadBackup: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post(`${BASE_URL}/api/admin/backup/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  uploadAndRestoreBackup: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post(`${BASE_URL}/api/admin/backup/upload-and-restore`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  // Remove clearCache as it's not functional
  // clearCache: async () => {
  //   const res = await axiosInstance.post(`${BASE_URL}/api/admin/clear-cache`);
  //   return res.data;
  // },

  getSystemInfo: async () => {
    const res = await axiosInstance.get(`${BASE_URL}/api/admin/system-info`);
    return res.data;
  },

  restoreDatabase: async (backupFile) => {
    await axiosInstance.post(`${API}/admin/database/restore`, { backup_file: backupFile });
  },

  getScheduledDatesForCalendar: async (startDate = null, endDate = null) => {
    let url = `${API}/schedule/scheduled-dates`;
    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      url += `?${params.toString()}`;
    }
    const res = await axiosInstance.get(url);
    return res.data;
  },

  // Audio Editor functions
  checkFfmpegStatus: async () => {
    const res = await axiosInstance.get(`${API}/audio-editor/check-ffmpeg`);
    return res.data;
  },

  trimAudioPreview: async (soundId, startTime, endTime) => {
    const formData = new FormData();
    formData.append('sound_id', soundId);
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    
    const res = await axiosInstance.post(`${API}/audio-editor/trim-preview`, formData, {
      responseType: 'blob'
    });
    return res.data;
  },

  processAndSaveAudio: async (soundId, startTime, endTime, fadeIn, fadeOut, volume, name, description, tags, type) => {
    const formData = new FormData();
    formData.append('sound_id', soundId);
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    formData.append('fade_in', fadeIn);
    formData.append('fade_out', fadeOut);
    formData.append('volume', volume);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('type', type);
    
    const res = await axiosInstance.post(`${API}/audio-editor/process-and-save`, formData);
    return res.data;
  },

  fadeAudioPreview: async (soundId, startTime, endTime, fadeIn, fadeOut, volume) => {
    const formData = new FormData();
    formData.append('sound_id', soundId);
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    formData.append('fade_in', fadeIn);
    formData.append('fade_out', fadeOut);
    formData.append('volume', volume);
    
    const res = await axiosInstance.post(`${API}/audio-editor/fade-preview`, formData, {
      responseType: 'blob'
    });
    return res.data;
  },

  // NTP Management
  getNtpStatus: async () => {
    const res = await axiosInstance.get(`${BASE_URL}/api/admin/ntp/status`);
    return res.data;
  },

  syncWithNtp: async () => {
    const res = await axiosInstance.post(`${BASE_URL}/api/admin/ntp/sync`);
    return res.data;
  },

  getNtpServers: async () => {
    const res = await axiosInstance.get(`${BASE_URL}/api/admin/ntp/servers`);
    return res.data;
  },

  // Audio Library Stats
  getAudioStats: async () => {
    const res = await axiosInstance.get(`${API}/audio/stats`);
    return res.data;
  },

  // System Stats
  getSystemStats: async () => {
    const res = await axiosInstance.get(`${API}/admin/system-stats`);
    return res.data;
  },

  stopPlayback: async () => {
    const res = await axiosInstance.post(`${API}/paging/stop-playback`);
    return res.data;
  },

  startLiveStreamWithCountdown: async () => {
    const res = await axiosInstance.post(`${API}/paging/start-live-stream-with-countdown`);
    return res.data;
  },

  // Paging system endpoints
  getAnnouncementHistory: async (limit = 20) => {
    const res = await axiosInstance.get(`${API}/paging/announcements?limit=${limit}`);
    return res.data;
  },
  playAnnouncement: async (id) => {
    const res = await axiosInstance.post(`${API}/paging/announcements/${id}/play`);
    return res.data;
  },
  startRecording: async (deviceSettings = null, duration = 0, playBell = false) => {
    const requestBody = {
      device_settings: deviceSettings || {
        device_id: 'default',
        sample_rate: 44100,
        bit_depth: 16,
        channels: 1
      },
      duration,
      play_bell: playBell
    };
    console.log('Sending start-recording request:', requestBody);
    const res = await axiosInstance.post(`${API}/paging/start-recording`, requestBody);
    return res.data;
  },
  stopRecording: async (name) => {
    const res = await axiosInstance.post(`${API}/paging/stop-recording`, { name });
    return res.data;
  },
  startLiveStream: async (inputDevice = 'default') => {
    const res = await axiosInstance.post(`${API}/paging/start-live-stream`, { input_device: inputDevice });
    return res.data;
  },
  stopLiveStream: async () => {
    const res = await axiosInstance.post(`${API}/paging/stop-live-stream`);
    return res.data;
  },
  getPagingStatus: async () => {
    const res = await axiosInstance.get(`${API}/paging/status`);
    return res.data;
  },
  getPagingSettings: async () => {
    const res = await axiosInstance.get(`${API}/paging/settings`);
    return res.data;
  },
  savePagingSettings: async (settings) => {
    const res = await axiosInstance.post(`${API}/paging/settings`, settings);
    return res.data;
  },

  // Upload a browser-recorded announcement
  uploadRecording: async (blob, name = null) => {
    const form = new FormData();
    form.append('file', blob, 'recording.webm');
    if (name) form.append('name', name);
    const res = await axiosInstance.post(`${API}/paging/upload-recording`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Enhanced paging endpoints
  getAudioInputDevices: async () => {
    const res = await axiosInstance.get(`${API}/paging/input-devices`);
    return res.data;
  },
  getDeviceCapabilities: async (deviceId) => {
    const res = await axiosInstance.get(`${API}/paging/input-devices/${encodeURIComponent(deviceId)}/capabilities`);
    return res.data;
  },
  startPushToTalk: async () => {
    const res = await axiosInstance.post(`${API}/paging/push-to-talk-start`);
    return res.data;
  },
  startPushToTalkStream: async (deviceSettings) => {
    const res = await axiosInstance.post(`${API}/paging/push-to-talk-stream`, deviceSettings);
    return res.data;
  },
  stopPushToTalk: async () => {
    const res = await axiosInstance.post(`${API}/paging/push-to-talk-stop`);
    return res.data;
  },

  // Playlist API methods
  getPlaylists: async () => {
    const res = await axiosInstance.get(`${BASE_URL}/api/playlists/`);
    return res.data;
  },

  getPlaylist: async (playlistId) => {
    const res = await axiosInstance.get(`${BASE_URL}/api/playlists/${playlistId}`);
    return res.data;
  },

  createPlaylist: async (name, description = null) => {
    const res = await axiosInstance.post(`${BASE_URL}/api/playlists/`, {
      name,
      description,
      is_active: true
    });
    return res.data;
  },

  updatePlaylist: async (playlistId, updates) => {
    const res = await axiosInstance.put(`${BASE_URL}/api/playlists/${playlistId}`, updates);
    return res.data;
  },

  deletePlaylist: async (playlistId) => {
    const res = await axiosInstance.delete(`${BASE_URL}/api/playlists/${playlistId}`);
    return res.data;
  },

  getPlaylistItems: async (playlistId) => {
    const res = await axiosInstance.get(`${BASE_URL}/api/playlists/${playlistId}/items`);
    return res.data;
  },

  addPlaylistItem: async (playlistId, position, soundId = null, streamUrl = null, streamName = null) => {
    const res = await axiosInstance.post(`${BASE_URL}/api/playlists/${playlistId}/items`, {
      position,
      sound_id: soundId,
      stream_url: streamUrl,
      stream_name: streamName
    });
    return res.data;
  },

  deletePlaylistItem: async (playlistId, itemId) => {
    const res = await axiosInstance.delete(`${BASE_URL}/api/playlists/${playlistId}/items/${itemId}`);
    return res.data;
  },

  reorderPlaylistItems: async (playlistId, itemPositions) => {
    const res = await axiosInstance.post(`${BASE_URL}/api/playlists/${playlistId}/reorder`, itemPositions);
    return res.data;
  },

  // Stream controls
  playStream: async (streamUrl) => {
    const res = await axiosInstance.post(`${API}/stream/play`, { stream_url: streamUrl });
    return res.data;
  },

  stopStream: async () => {
    const res = await axiosInstance.post(`${API}/stream/stop`);
    return res.data;
  },

  // Playlist audio controls
  playSoundForPlaylist: async (soundId) => {
    const res = await axiosInstance.post(`${API}/sounds/${soundId}/play-playlist`);
    return res.data;
  },

  stopPlaylistAudio: async () => {
    const res = await axiosInstance.post(`${API}/sounds/stop-playlist-audio`);
    return res.data;
  },

  // Enhanced mute controls
  getMuteStatus: async () => {
    const res = await axiosInstance.get(`${API}/schedule/mute-status`);
    return res.data;
  },

  setMuteMode: async (mute, mode = 'all') => {
    const res = await axiosInstance.post(`${API}/schedule/mute-all`, {
      mute,
      mode  // 'all' or 'schedules_only'
    });
    return res.data;
  }
};
