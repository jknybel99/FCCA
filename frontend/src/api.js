import axios from "axios";

const BASE_URL = "http://localhost:8000";
const API = `${BASE_URL}/api`;

export default {
  // Schedules
  getSchedules: async () => {
    const res = await axios.get(`${API}/schedule/`);
    return res.data;
  },

  updateSchedule: async (id, scheduleData) => {
    const res = await axios.put(`${API}/schedule/${id}`, scheduleData);
    return res.data;
  },

  getScheduleDays: async (scheduleId) => {
    const res = await axios.get(`${API}/schedule/${scheduleId}/days`);
    return res.data;
  },

  // Bell Events
  getBellEventsByDay: async (dayId) => {
    const res = await axios.get(`${API}/schedule/days/${dayId}/events`);
    return res.data;
  },

  getBellEvents: async () => {
    const res = await axios.get(`${API}/schedule/events`);
    return res.data;
  },

  createBellEvent: async (event) => {
    const res = await axios.post(`${API}/schedule/events`, event);
    return res.data;
  },

  // COPY a bell event to other days
  copyBellEvent: async (eventData) => {
    const res = await axios.post(`${API}/schedule/events/copy`, eventData);
    return res.data;
  },

  // UPDATE a bell event
  updateBellEvent: async (eventId, event) => {
    const res = await axios.put(`${API}/schedule/events/${eventId}`, event);
    return res.data;
  },

  // DELETE a bell event
  deleteBellEvent: async (eventId) => {
    const res = await axios.delete(`${API}/schedule/events/${eventId}`);
    return res.data;
  },

  // DELETE all similar bell events (same description and time across all days)
  deleteSimilarBellEvents: async (eventId) => {
    const res = await axios.delete(`${API}/schedule/events/similar/${eventId}`);
    return res.data;
  },

  // Special Schedules
  createSpecialSchedule: async (scheduleData) => {
    const res = await axios.post(`${API}/schedule/special/`, scheduleData);
    return res.data;
  },

  getSpecialSchedules: async (startDate = null, endDate = null) => {
    let url = `${API}/schedule/special/`;
    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      url += `?${params.toString()}`;
    }
    const res = await axios.get(url);
    return res.data;
  },

  getSpecialSchedule: async (id) => {
    const res = await axios.get(`${API}/schedule/special/${id}`);
    return res.data;
  },

  deleteSpecialSchedule: async (id) => {
    const res = await axios.delete(`${API}/schedule/special/${id}`);
    return res.data;
  },

  scheduleSpecialEvent: async (specialScheduleId, date) => {
    const res = await axios.post(`${API}/schedule/special/${specialScheduleId}/schedule`, {
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
    
    const res = await axios.post(`${API}/schedule/special/activate`, {
      special_schedule_id: specialScheduleId,
      target_date: targetDate
    });
    
    console.log('API response:', res.data);
    return res.data;
  },

  activateSpecialScheduleForDay: async (specialScheduleId, dayOfWeek) => {
    const res = await axios.post(`${API}/schedule/special/activate-day`, {
      special_schedule_id: specialScheduleId,
      day_of_week: dayOfWeek
    });
    return res.data;
  },

  deactivateSpecialScheduleForDay: async (specialScheduleId, dayOfWeek) => {
    const res = await axios.post(`${API}/schedule/special/deactivate-day`, {
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
    
    const res = await axios.post(`${API}/schedule/special/schedule-date`, {
      special_schedule_id: specialScheduleId,
      target_date: targetDate
    });
    
    console.log('API response:', res.data);
    return res.data;
  },

  unscheduleSpecialScheduleForDate: async (targetDate) => {
    const res = await axios.post(`${API}/schedule/special/unschedule-date`, {
      target_date: targetDate
    });
    return res.data;
  },

  // Special schedule days and events
  createSpecialScheduleDay: async (specialScheduleId, dayData) => {
    const res = await axios.post(`${API}/schedule/special/${specialScheduleId}/days`, dayData);
    return res.data;
  },

  getSpecialScheduleDays: async (specialScheduleId) => {
    const res = await axios.get(`${API}/schedule/special/${specialScheduleId}/days`);
    return res.data;
  },

  createSpecialBellEvent: async (specialScheduleId, eventData) => {
    const res = await axios.post(`${API}/schedule/special/${specialScheduleId}/events`, eventData);
    return res.data;
  },

  getSpecialBellEventsByDay: async (specialDayId) => {
    const res = await axios.get(`${API}/schedule/special/days/${specialDayId}/events`);
    return res.data;
  },

  getSpecialBellEvents: async (specialScheduleId) => {
    const res = await axios.get(`${API}/schedule/special/${specialScheduleId}/events`);
    return res.data;
  },

  deleteSpecialBellEvent: async (eventId) => {
    const res = await axios.delete(`${API}/schedule/special/events/${eventId}`);
    return res.data;
  },

  updateSpecialBellEvent: async (eventId, eventData) => {
    const res = await axios.put(`${API}/schedule/special/events/${eventId}`, eventData);
    return res.data;
  },

  copySpecialBellEvent: async (eventId, targetDayIds) => {
    const res = await axios.post(`${API}/schedule/special/events/${eventId}/copy`, {
      target_day_ids: targetDayIds
    });
    return res.data;
  },

  // Sounds
  getAudioFiles: async () => {
    const res = await axios.get(`${API}/sounds/`);
    return res.data;
  },

  uploadSound: async (formData) => {
    const res = await axios.post(`${API}/sounds/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  deleteSound: async (soundId) => {
    const res = await axios.delete(`${API}/sounds/${soundId}`);
    return res.data;
  },

  updateSound: async (soundId, soundData) => {
    const formData = new FormData();
    if (soundData.name !== undefined) formData.append('name', soundData.name);
    if (soundData.description !== undefined) formData.append('description', soundData.description);
    if (soundData.tags !== undefined) formData.append('tags', soundData.tags);
    if (soundData.type !== undefined) formData.append('type', soundData.type);
    
    const res = await axios.put(`${API}/sounds/${soundId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  playSound: async (soundId) => {
    const res = await axios.post(`${API}/sounds/${soundId}/play`);
    return res.data;
  },

  playAudio: async (soundId) => {
    const res = await axios.post(`${API}/sounds/${soundId}/play`);
    return res.data;
  },

  stopAudio: async () => {
    const res = await axios.post(`${API}/audio/stop`);
    return res.data;
  },

  stopAllAudio: async () => {
    const res = await axios.post(`${API}/audio/stop-all`);
    return res.data;
  },

  getAudioSettings: async () => {
    const res = await axios.get(`${API}/audio/settings`);
    return res.data;
  },

  saveAudioSettings: async (settings) => {
    const res = await axios.post(`${API}/audio/settings`, settings);
    return res.data;
  },

  getAudioOutputs: async () => {
    const res = await axios.get(`${API}/audio/outputs`);
    return res.data;
  },

  uploadAudioFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API}/sounds/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // GET next event
  getNextEvent: async () => {
    const res = await axios.get(`${API}/schedule/next`);
    return res.data;
  },

  // GET system status
  getSystemStatus: async () => {
    const res = await axios.get(`${BASE_URL}/api/system/status`);
    return res.data;
  },

  // Mute all schedules
  muteAllSchedules: async (muted) => {
    const res = await axios.post(`${API}/schedule/mute-all`, { mute: muted });
    return res.data;
  },

  // TTS
  generateTTS: async (text, language = null) => {
    const form = new FormData();
    form.append("text", text);
    if (language) {
      form.append("language", language);
    }
    const res = await axios.post(`${API}/tts/announce`, form);
    return res.data;
  },

  getAvailableVoices: async () => {
    const res = await axios.get(`${API}/tts/voices`);
    return res.data;
  },

  detectLanguage: async (text) => {
    const form = new FormData();
    form.append("text", text);
    const res = await axios.post(`${API}/tts/detect-language`, form);
    return res.data;
  },

  // Admin functions (with authentication)
  getAdminSettings: async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/settings`);
    return res.data;
  },

  saveAdminSettings: async (settings) => {
    const res = await axios.post(`${BASE_URL}/api/admin/settings`, settings);
    return res.data;
  },

  uploadLogo: async (formData) => {
    const res = await axios.post(`${BASE_URL}/api/admin/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  createBackup: async () => {
    const res = await axios.post(`${BASE_URL}/api/admin/backup`);
    return res.data;
  },

  listBackups: async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/backups`);
    return res.data;
  },

  restoreBackup: async (backupFilename) => {
    const res = await axios.post(`${BASE_URL}/api/admin/backup/restore/${backupFilename}`);
    return res.data;
  },

  deleteBackup: async (backupFilename) => {
    const res = await axios.delete(`${BASE_URL}/api/admin/backup/${backupFilename}`);
    return res.data;
  },

  getBackupStatus: async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/backup/status`);
    return res.data;
  },

  // Remove clearCache as it's not functional
  // clearCache: async () => {
  //   const res = await axios.post(`${BASE_URL}/api/admin/clear-cache`);
  //   return res.data;
  // },

  getSystemInfo: async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/system-info`);
    return res.data;
  },

  restoreDatabase: async (backupFile) => {
    await axios.post(`${API}/admin/database/restore`, { backup_file: backupFile });
  },

  getScheduledDatesForCalendar: async (startDate = null, endDate = null) => {
    let url = `${API}/schedule/scheduled-dates`;
    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      url += `?${params.toString()}`;
    }
    const res = await axios.get(url);
    return res.data;
  },

  // Audio Editor functions
  checkFfmpegStatus: async () => {
    const res = await axios.get(`${API}/audio-editor/check-ffmpeg`);
    return res.data;
  },

  trimAudioPreview: async (soundId, startTime, endTime) => {
    const formData = new FormData();
    formData.append('sound_id', soundId);
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    
    const res = await axios.post(`${API}/audio-editor/trim-preview`, formData, {
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
    
    const res = await axios.post(`${API}/audio-editor/process-and-save`, formData);
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
    
    const res = await axios.post(`${API}/audio-editor/fade-preview`, formData, {
      responseType: 'blob'
    });
    return res.data;
  },

  // NTP Management
  getNtpStatus: async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/ntp/status`);
    return res.data;
  },

  syncWithNtp: async () => {
    const res = await axios.post(`${BASE_URL}/api/admin/ntp/sync`);
    return res.data;
  },

  getNtpServers: async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/ntp/servers`);
    return res.data;
  },

  // Audio Library Stats
  getAudioStats: async () => {
    const res = await axios.get(`${API}/audio/stats`);
    return res.data;
  },

  // System Stats
  getSystemStats: async () => {
    const res = await axios.get(`${API}/admin/system-stats`);
    return res.data;
  }
};
