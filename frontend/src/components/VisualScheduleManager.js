import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, IconButton, Snackbar, Alert,
  Tabs, Tab, Paper, ToggleButtonGroup, ToggleButton, Chip, Card, CardContent, TextField,
  Checkbox, FormControlLabel, FormGroup, FormLabel
} from '@mui/material';
import {
  PlayArrow, Stop, SwapHoriz, CalendarMonth, ViewDay, ViewWeek,
  DragIndicator, Edit, Delete, Add, AddCircle, MusicNote, ContentCopy
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import api from '../api';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday', short: 'Mon' },
  { value: 1, label: 'Tuesday', short: 'Tue' },
  { value: 2, label: 'Wednesday', short: 'Wed' },
  { value: 3, label: 'Thursday', short: 'Thu' },
  { value: 4, label: 'Friday', short: 'Fri' }
];

const SCHOOL_HOURS = Array.from({ length: 10 }, (_, i) => i + 7);
const TIME_SLOTS = [0, 15, 30, 45]; // 15-minute intervals

const formatTime12Hour = (hour) => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

export default function VisualScheduleManager() {
  const [viewType, setViewType] = useState('week');
  const [selectedDay, setSelectedDay] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [specialSchedules, setSpecialSchedules] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [events, setEvents] = useState({});
  const [specialEvents, setSpecialEvents] = useState({});
  const [playingAudio, setPlayingAudio] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [massReplaceDialogOpen, setMassReplaceDialogOpen] = useState(false);
  const [selectedScheduleForReplace, setSelectedScheduleForReplace] = useState(null);
  const [oldSoundId, setOldSoundId] = useState('');
  const [newSoundId, setNewSoundId] = useState('');
  const [isSpecialScheduleReplace, setIsSpecialScheduleReplace] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editTime, setEditTime] = useState(dayjs());
  
  // Add event dialog
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [newEventTime, setNewEventTime] = useState(dayjs());
  const [newEventDay, setNewEventDay] = useState(0);
  const [newEventSound, setNewEventSound] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState([0]); // For multi-day selection
  const [selectedSpecialSchedules, setSelectedSpecialSchedules] = useState([]); // For multi-schedule selection

  // Copy special schedule states
  const [copySpecialScheduleDialogOpen, setCopySpecialScheduleDialogOpen] = useState(false);
  const [scheduleToCopy, setScheduleToCopy] = useState(null);
  const [copyScheduleForm, setCopyScheduleForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [schedulesData, specialSchedulesData, audioData] = await Promise.all([
        api.getSchedules(), api.getSpecialSchedules(), api.getAudioFiles()
      ]);
      
      console.log('🔍 Special Schedules Data:', JSON.stringify(specialSchedulesData, null, 2));
      
      setSchedules(schedulesData);
      setSpecialSchedules(specialSchedulesData);
      setAudioFiles(audioData);
      
      // Load events for DEFAULT schedule only to avoid duplicates
      const defaultSchedule = schedulesData.find(s => s.is_default);
      const eventsData = {};
      
      if (defaultSchedule) {
        const days = await api.getScheduleDays(defaultSchedule.id);
        eventsData[defaultSchedule.id] = {};
        
        console.log('Days:', days);
        
        for (const day of days) {
          const dayEvents = await api.getBellEventsByDay(day.id);
          console.log(`Day ${day.day_of_week} (ID: ${day.id}):`, dayEvents.length, 'events');
          eventsData[defaultSchedule.id][day.day_of_week] = dayEvents;
        }
      }
      setEvents(eventsData);
      
      const specialEventsData = {};
      for (const special of specialSchedulesData) {
        specialEventsData[special.id] = await api.getSpecialBellEvents(special.id);
      }
      setSpecialEvents(specialEventsData);
    } catch (error) {
      console.error('Load error:', error);
      showSnackbar('Error loading data', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDragStart = (e, event) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id); // Required for Firefox
    setDraggedEvent(event);
    console.log('Started dragging:', event);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';
  };

  const handleDrop = async (e, hour, dayOfWeek) => {
    // Keep the original minutes when dragging
    const minute = 0;
    e.preventDefault();
    e.stopPropagation();
    
    // Reset background color
    e.currentTarget.style.backgroundColor = '';
    
    if (!draggedEvent) {
      console.log('No dragged event found');
      return;
    }

    try {
      const timeParts = draggedEvent.time.split(':');
      const oldHour = parseInt(timeParts[0]);
      const oldMinutes = timeParts[1] || '00'; // Keep original minutes
      const seconds = timeParts[2] || '00';
      const newTime = `${hour.toString().padStart(2, '0')}:${oldMinutes}:${seconds}`;
      
      console.log('Dropping event:', draggedEvent.id);
      console.log('From hour:', oldHour, 'To hour:', hour);
      console.log('Old time:', draggedEvent.time, 'New time:', newTime);
      
      // Don't update if hour hasn't changed
      if (oldHour === hour) {
        console.log('Same hour, skipping update');
        setDraggedEvent(null);
        return;
      }
      
      // Prepare update data with all required fields
      const updateData = {
        time: newTime,
        sound_id: draggedEvent.sound_id,
        description: draggedEvent.description || '',
        is_active: draggedEvent.is_active
      };

      if (draggedEvent.isSpecial) {
        console.log('Updating special event:', draggedEvent.id);
        updateData.special_schedule_id = draggedEvent.special_schedule_id;
        const result = await api.updateSpecialBellEvent(draggedEvent.id, updateData);
        console.log('Update result:', result);
      } else {
        console.log('Updating regular event:', draggedEvent.id);
        updateData.schedule_day_id = draggedEvent.schedule_day_id;
        const result = await api.updateBellEvent(draggedEvent.id, updateData);
        console.log('Update result:', result);
      }
      
      showSnackbar(`Event moved to ${formatTime12Hour(hour)} hour - Click event to adjust exact time`);
      setDraggedEvent(null);
      await loadData();
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new Event('scheduleUpdated'));
    } catch (error) {
      console.error('Drop error details:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMsg = 'Error moving event';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail;
        } else {
          errorMsg = JSON.stringify(error.response.data.detail);
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      showSnackbar(errorMsg, 'error');
      setDraggedEvent(null);
    }
  };

  const handleCellClick = (hour, dayOfWeek) => {
    const defaultSchedule = schedules.find(s => s.is_default);
    if (!defaultSchedule) return;
    
    // Set time to the clicked hour
    const clickedTime = dayjs().hour(hour).minute(0).second(0);
    setNewEventTime(clickedTime);
    setNewEventDay(dayOfWeek);
    setSelectedDays([dayOfWeek]); // Initialize with clicked day
    setNewEventSound('');
    setNewEventDescription('');
    setAddEventDialogOpen(true);
  };

  const handleCellClickSpecial = (hour, specialScheduleId) => {
    const clickedTime = dayjs().hour(hour).minute(0).second(0);
    setNewEventTime(clickedTime);
    setNewEventDay(specialScheduleId); // Store special schedule ID
    setSelectedSpecialSchedules([specialScheduleId]); // Initialize with clicked schedule
    setNewEventSound('');
    setNewEventDescription('');
    setAddEventDialogOpen(true);
  };

  const handleAddEvent = async () => {
    const defaultSchedule = schedules.find(s => s.is_default);
    if (!defaultSchedule || !newEventSound) {
      showSnackbar('Please select a sound', 'error');
      return;
    }

    try {
      // Find the schedule days for all selected days
      const days = await api.getScheduleDays(defaultSchedule.id);
      
      // Create events for each selected day
      for (const dayValue of selectedDays) {
        const scheduleDay = days.find(d => d.day_of_week === dayValue);
        
        if (!scheduleDay) {
          console.warn(`Schedule day not found for day ${dayValue}`);
          continue;
        }

        const eventData = {
          schedule_day_id: scheduleDay.id,
          time: newEventTime.format('HH:mm:ss'),
          sound_id: parseInt(newEventSound),
          description: newEventDescription,
          is_active: true
        };

        await api.createBellEvent(eventData);
      }
      
      showSnackbar(`Event added to ${selectedDays.length} day(s)`);
      setAddEventDialogOpen(false);
      setSelectedDays([0]); // Reset to Monday
      await loadData();
    } catch (error) {
      console.error('Error adding event:', error);
      showSnackbar('Error adding event', 'error');
    }
  };

  const handleAddSpecialEvent = async () => {
    if (!newEventSound) {
      showSnackbar('Please select a sound', 'error');
      return;
    }

    try {
      // Create events for each selected special schedule
      for (const scheduleId of selectedSpecialSchedules) {
        const eventData = {
          special_schedule_id: scheduleId,
          time: newEventTime.format('HH:mm:ss'),
          sound_id: parseInt(newEventSound),
          description: newEventDescription,
          is_active: true
        };

        await api.createSpecialBellEvent(eventData);
      }
      
      showSnackbar(`Event added to ${selectedSpecialSchedules.length} special schedule(s)`);
      setAddEventDialogOpen(false);
      setSelectedSpecialSchedules([]); // Reset
      await loadData();
    } catch (error) {
      console.error('Error adding special event:', error);
      showSnackbar('Error adding special event', 'error');
    }
  };

  const handleSaveEditTime = async () => {
    if (!editingEvent) return;
    
    try {
      const newTime = editTime.format('HH:mm:ss');
      const updateData = {
        time: newTime,
        sound_id: editingEvent.sound_id,
        description: editingEvent.description || '',
        is_active: editingEvent.is_active
      };

      if (editingEvent.isSpecial) {
        updateData.special_schedule_id = editingEvent.special_schedule_id;
        await api.updateSpecialBellEvent(editingEvent.id, updateData);
      } else {
        updateData.schedule_day_id = editingEvent.schedule_day_id;
        await api.updateBellEvent(editingEvent.id, updateData);
      }
      
      showSnackbar('Event time updated');
      setEditDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error updating event:', error);
      showSnackbar('Error updating event', 'error');
    }
  };

  const getEventColor = (event) => {
    if (!event.sound) return { bg: 'grey.200', border: 'grey.500' };
    
    const fileName = event.sound.name.toLowerCase();
    
    // Bell sounds
    if (fileName.includes('bell') || fileName.includes('chime') || fileName.includes('ding')) {
      return { bg: '#bbdefb', border: '#1976d2' }; // Blue
    }
    // Music
    if (fileName.includes('music') || fileName.includes('song') || fileName.includes('anthem')) {
      return { bg: '#f8bbd0', border: '#c2185b' }; // Pink
    }
    // Announcements/TTS
    if (event.tts_text || fileName.includes('announcement') || fileName.includes('voice')) {
      return { bg: '#c5e1a5', border: '#689f38' }; // Green
    }
    // Default
    return { bg: '#ffe0b2', border: '#f57c00' }; // Orange
  };

  const handleMassReplace = async () => {
    if (!oldSoundId || !newSoundId) return;
    
    try {
      let count = 0;
      if (isSpecialScheduleReplace) {
        for (const event of specialEvents[selectedScheduleForReplace.id] || []) {
          if (event.sound_id === parseInt(oldSoundId)) {
            // Include all required fields for special events
            const updateData = {
              time: event.time,
              description: event.description || '',
              sound_id: parseInt(newSoundId),
              tts_text: event.tts_text || null,
              repeat_tag: event.repeat_tag || null,
              is_active: event.is_active
            };
            await api.updateSpecialBellEvent(event.id, updateData);
            count++;
          }
        }
      } else {
        for (const dayEvents of Object.values(events[selectedScheduleForReplace.id] || {})) {
          for (const event of dayEvents) {
            if (event.sound_id === parseInt(oldSoundId)) {
              await api.updateBellEvent(event.id, { sound_id: parseInt(newSoundId) });
              count++;
            }
          }
        }
      }
      showSnackbar(`Replaced ${count} event(s)`);
      setMassReplaceDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Mass replace error:', error);
      showSnackbar('Error replacing: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleOpenCopySpecialScheduleDialog = (schedule) => {
    setScheduleToCopy(schedule);
    setCopyScheduleForm({
      name: `${schedule.name} (Copy)`,
      description: schedule.description || ''
    });
    setCopySpecialScheduleDialogOpen(true);
  };

  const handleCopySpecialSchedule = async () => {
    if (!scheduleToCopy || !copyScheduleForm.name.trim()) {
      showSnackbar('Please enter a name for the copied schedule', 'error');
      return;
    }

    try {
      await api.copySpecialSchedule(
        scheduleToCopy.id,
        copyScheduleForm.name,
        copyScheduleForm.description
      );
      setCopySpecialScheduleDialogOpen(false);
      setScheduleToCopy(null);
      setCopyScheduleForm({ name: '', description: '' });
      loadData();
      showSnackbar('Special schedule copied successfully');
    } catch (error) {
      console.error('Error copying special schedule:', error);
      showSnackbar('Error copying special schedule', 'error');
    }
  };

  const renderTimeGrid = () => {
    const defaultSchedule = schedules.find(s => s.is_default);
    if (!defaultSchedule) return null;

    const daysToShow = viewType === 'week' ? DAYS_OF_WEEK : [DAYS_OF_WEEK[selectedDay]];

    return (
      <Box sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 2, 
        overflow: 'auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxHeight: 'calc(100vh - 250px)',
        position: 'relative'
      }}>
        {/* Header Row - Sticky */}
        <Box sx={{ 
          display: 'flex', 
          bgcolor: '#1976d2',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ 
            width: '60px', 
            flexShrink: 0, 
            p: 1, 
            fontWeight: 'bold', 
            color: 'white',
            fontSize: '0.75rem',
            textAlign: 'center',
            borderRight: '1px solid rgba(255,255,255,0.2)'
          }}>
            Time
          </Box>
          {daysToShow.map(day => (
            <Box 
              key={day.value} 
              sx={{ 
                flex: 1,
                p: 1, 
                fontWeight: 'bold', 
                color: 'white',
                fontSize: '0.875rem',
                textAlign: 'center',
                borderRight: day.value !== daysToShow[daysToShow.length - 1].value ? '1px solid rgba(255,255,255,0.2)' : 'none'
              }}
            >
              {viewType === 'week' ? day.short : day.label}
            </Box>
          ))}
        </Box>

        {SCHOOL_HOURS.map(hour => (
          <Box key={hour} sx={{ display: 'flex', borderTop: '1px solid #e0e0e0', bgcolor: hour % 2 === 0 ? '#fafafa' : 'white', minHeight: '70px' }}>
            <Box sx={{ width: '60px', p: 1, fontSize: '0.75rem', textAlign: 'center', fontWeight: 500, borderRight: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {formatTime12Hour(hour)}
            </Box>
            
            {daysToShow.map(day => {
              const dayEvents = events[defaultSchedule.id]?.[day.value] || [];
              const eventsAtTime = dayEvents.filter(event => {
                const eventHour = parseInt(event.time.split(':')[0]);
                return eventHour === hour;
              });
              
              return (
                <Box 
                  key={day.value} 
                  sx={{ 
                    flex: 1, 
                    p: 0.5, 
                    borderRight: '1px solid #e0e0e0', 
                    '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' },
                    minHeight: '70px',
                    position: 'relative'
                  }}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, hour, day.value)}
                  onClick={() => handleCellClick(hour, day.value)}
                >
                  {eventsAtTime.map(event => {
                    const colors = getEventColor(event);
                    return (
                      <Card 
                        key={event.id} 
                        draggable={true}
                        onDragStart={(e) => {
                          handleDragStart(e, { ...event, isSpecial: false });
                        }}
                        onDragEnd={() => setDraggedEvent(null)}
                        sx={{ 
                          mb: 0.5, 
                          cursor: 'grab', 
                          bgcolor: colors.bg, 
                          borderLeft: '4px solid', 
                          borderLeftColor: colors.border, 
                          '&:hover': { boxShadow: 3, transform: 'scale(1.02)' }, 
                          '&:active': { cursor: 'grabbing' },
                          userSelect: 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <DragIndicator sx={{ fontSize: '0.875rem', color: 'action.active' }} />
                            <Typography variant="caption" fontWeight="bold" sx={{ flex: 1 }}>
                              {dayjs(`2000-01-01 ${event.time}`).format('h:mm A')}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent({ ...event, isSpecial: false });
                                setEditTime(dayjs(`2000-01-01 ${event.time}`));
                                setEditDialogOpen(true);
                              }} 
                              sx={{ p: 0.25 }}
                              title="Edit time"
                            >
                              <Edit sx={{ fontSize: '1rem' }} />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                api.playSound(event.sound?.id);
                              }} 
                              sx={{ p: 0.25 }}
                              title="Play"
                            >
                              <PlayArrow sx={{ fontSize: '1rem' }} />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Delete this event?')) {
                                  api.deleteBellEvent(event.id).then(() => {
                                    showSnackbar('Event deleted');
                                    loadData();
                                  });
                                }
                              }} 
                              sx={{ p: 0.25 }}
                              title="Delete"
                            >
                              <Delete sx={{ fontSize: '1rem', color: 'error.main' }} />
                            </IconButton>
                          </Box>
                          {event.description && (
                            <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                              {event.description}
                            </Typography>
                          )}
                          {event.sound && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                              🎵 {event.sound.name}
                            </Typography>
                          )}
                          {event.tts_text && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                              📢 {event.tts_text.substring(0, 30)}...
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Regular Schedule" />
          <Tab label="Special Schedules" />
        </Tabs>
      </Paper>

      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              💡 <strong>Click</strong> any time slot to add event • <strong>Drag</strong> events to reschedule • Special schedules override regular schedule
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddCircle />}
              onClick={() => {
                if (specialSchedules.length > 0) {
                  setSelectedSpecialSchedules([specialSchedules[0].id]);
                  setNewEventTime(dayjs().hour(8).minute(0));
                  setNewEventSound('');
                  setNewEventDescription('');
                  setAddEventDialogOpen(true);
                }
              }}
              size="small"
              disabled={specialSchedules.length === 0}
            >
              Add Event
            </Button>
          </Box>
          
          {specialSchedules.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">No special schedules found</Typography>
            </Box>
          ) : (
            specialSchedules
              .filter(special => special.is_active) // Only show active schedules
              .map(special => {
              const eventsForSchedule = specialEvents[special.id] || [];
              const scheduledDates = special.scheduled_dates || [];
              
              // Remove duplicate dates and only show upcoming dates in current month
              const today = dayjs();
              const currentMonth = today.month();
              const currentYear = today.year();
              
              const uniqueDates = scheduledDates.reduce((acc, dateObj) => {
                const dateStr = typeof dateObj === 'string' ? dateObj : dateObj.date;
                const date = dayjs(dateStr);
                const normalizedDateStr = date.format('YYYY-MM-DD');
                const todayStr = today.format('YYYY-MM-DD');
                
                // Only include dates that are today or in the future AND in the current month
                if (normalizedDateStr >= todayStr && 
                    date.month() === currentMonth && 
                    date.year() === currentYear &&
                    !acc.some(d => {
                      const existingDateStr = typeof d === 'string' ? d : d.date;
                      return dayjs(existingDateStr).format('YYYY-MM-DD') === normalizedDateStr;
                    })) {
                  acc.push(dateObj);
                }
                return acc;
              }, []);
              
              return (
                <Card key={special.id} sx={{ mb: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#00897b' }}>{special.name}</Typography>
                        <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                          {uniqueDates.map((dateObj, idx) => {
                            const dateStr = typeof dateObj === 'string' ? dateObj : dateObj.date;
                            return (
                              <Chip
                                key={idx}
                                icon={<CalendarMonth />}
                                label={dayjs(dateStr).format('MMM D, YYYY')}
                                size="small"
                                sx={{ bgcolor: '#b2dfdb', color: '#00695c' }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          sx={{ color: '#1976d2', borderColor: '#1976d2', '&:hover': { borderColor: '#1565c0', bgcolor: 'rgba(25, 118, 210, 0.04)' } }}
                          startIcon={<ContentCopy />}
                          onClick={() => handleOpenCopySpecialScheduleDialog(special)}
                        >
                          Copy
                        </Button>
                        <Button
                          variant="outlined"
                          sx={{ color: '#00897b', borderColor: '#00897b', '&:hover': { borderColor: '#00695c', bgcolor: 'rgba(0, 137, 123, 0.04)' } }}
                          startIcon={<SwapHoriz />}
                          onClick={() => {
                            setSelectedScheduleForReplace(special);
                            setIsSpecialScheduleReplace(true);
                            setMassReplaceDialogOpen(true);
                          }}
                        >
                          Mass Replace
                        </Button>
                      </Box>
                    </Box>

                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', mt: 2, boxShadow: 2 }}>
                      <Box sx={{ display: 'flex', bgcolor: '#00897b' }}>
                        <Box sx={{ width: '80px', p: 1, fontWeight: 'bold', color: 'white', fontSize: '0.75rem', textAlign: 'center' }}>
                          Time
                        </Box>
                        <Box sx={{ flex: 1, p: 1, fontWeight: 'bold', color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                          Events
                        </Box>
                      </Box>

                      {SCHOOL_HOURS.map(hour => {
                        const eventsAtTime = eventsForSchedule
                          .filter(e => parseInt(e.time.split(':')[0]) === hour)
                          .sort((a, b) => a.time.localeCompare(b.time));
                        
                        return (
                          <Box key={hour} sx={{ display: 'flex', borderTop: '1px solid #e0e0e0', bgcolor: hour % 2 === 0 ? '#fafafa' : 'white', minHeight: '70px' }}>
                            <Box sx={{ width: '80px', p: 1, fontSize: '0.75rem', textAlign: 'center', fontWeight: 500, borderRight: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {formatTime12Hour(hour)}
                            </Box>
                            
                            <Box sx={{ flex: 1, p: 0.5, '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
                              onDragOver={handleDragOver}
                              onDragEnter={handleDragEnter}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, hour, 0)}
                              onClick={() => handleCellClickSpecial(hour, special.id)}>
                              {eventsAtTime.map(event => {
                                const colors = getEventColor(event);
                                return (
                                  <Card 
                                    key={event.id} 
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, { ...event, isSpecial: true })}
                                    onDragEnd={() => setDraggedEvent(null)}
                                    sx={{ 
                                      mb: 0.5, 
                                      cursor: 'grab', 
                                      bgcolor: colors.bg,
                                      borderLeft: '4px solid',
                                      borderLeftColor: colors.border,
                                      '&:hover': { boxShadow: 3, transform: 'scale(1.02)' },
                                      '&:active': { cursor: 'grabbing' },
                                      userSelect: 'none',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                        <DragIndicator sx={{ fontSize: '0.875rem' }} />
                                        <Typography variant="caption" fontWeight="bold" sx={{ flex: 1 }}>
                                          {dayjs(`2000-01-01 ${event.time}`).format('h:mm A')}
                                        </Typography>
                                        <IconButton 
                                          size="small" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingEvent({ ...event, isSpecial: true });
                                            setEditTime(dayjs(`2000-01-01 ${event.time}`));
                                            setEditDialogOpen(true);
                                          }} 
                                          sx={{ p: 0.25 }}
                                          title="Edit time"
                                        >
                                          <Edit sx={{ fontSize: '1rem' }} />
                                        </IconButton>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); api.playSound(event.sound?.id); }} sx={{ p: 0.25 }} title="Play">
                                          <PlayArrow sx={{ fontSize: '1rem' }} />
                                        </IconButton>
                                        <IconButton 
                                          size="small" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Delete this event?')) {
                                              api.deleteSpecialBellEvent(event.id).then(() => {
                                                showSnackbar('Event deleted');
                                                loadData();
                                              });
                                            }
                                          }} 
                                          sx={{ p: 0.25 }}
                                          title="Delete"
                                        >
                                          <Delete sx={{ fontSize: '1rem', color: 'error.main' }} />
                                        </IconButton>
                                      </Box>
                                      {event.description && (
                                        <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                                          {event.description}
                                        </Typography>
                                      )}
                                      {event.sound && (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                          🎵 {event.sound.name}
                                        </Typography>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      )}

      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            <ToggleButtonGroup value={viewType} exclusive onChange={(e, v) => v && setViewType(v)} size="small">
              <ToggleButton value="day"><ViewDay sx={{ mr: 1 }} />Day</ToggleButton>
              <ToggleButton value="week"><ViewWeek sx={{ mr: 1 }} />Week</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {viewType === 'day' && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                    {DAYS_OF_WEEK.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
              
              <Button
                variant="contained"
                startIcon={<AddCircle />}
                onClick={() => {
                  setNewEventDay(viewType === 'day' ? selectedDay : 0);
                  setSelectedDays(viewType === 'day' ? [selectedDay] : [0, 1, 2, 3, 4]); // All weekdays in week view
                  setNewEventTime(dayjs().hour(8).minute(0));
                  setNewEventSound('');
                  setNewEventDescription('');
                  setAddEventDialogOpen(true);
                }}
                size="small"
              >
                Add Event
              </Button>
            </Box>

            <Button variant="outlined" startIcon={<SwapHoriz />} 
              onClick={() => {
                const s = schedules.find(s => s.is_default);
                if (s) { setSelectedScheduleForReplace(s); setIsSpecialScheduleReplace(false); setMassReplaceDialogOpen(true); }
              }}>
              Mass Replace
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            💡 <strong>Click</strong> any time slot to add event • <strong>Drag</strong> events to reschedule • Showing 7 AM - 4 PM
          </Typography>

          {renderTimeGrid()}
        </Box>
      )}

      {/* Edit Time Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Event Time</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TimePicker
              label="Event Time"
              value={editTime}
              onChange={(newValue) => setEditTime(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEditTime} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={addEventDialogOpen} onClose={() => setAddEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Event - {
            tabValue === 0 
              ? `${DAYS_OF_WEEK.find(d => d.value === newEventDay)?.label} at ${newEventTime.format('h:mm A')}`
              : `Special Schedule at ${newEventTime.format('h:mm A')}`
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TimePicker
              label="Event Time"
              value={newEventTime}
              onChange={(newValue) => setNewEventTime(newValue)}
              slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sound</InputLabel>
              <Select
                value={newEventSound}
                onChange={(e) => setNewEventSound(e.target.value)}
                label="Sound"
              >
                <MenuItem value=""><em>Select a sound</em></MenuItem>
                {audioFiles.map(audio => (
                  <MenuItem key={audio.id} value={audio.id}>{audio.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description (optional)"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              placeholder="e.g., Morning Bell, Lunch Break"
              sx={{ mb: 2 }}
            />
            
            {tabValue === 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <FormLabel component="legend" sx={{ mb: 1 }}>Select Days</FormLabel>
                <FormGroup row>
                  {DAYS_OF_WEEK.map(day => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={selectedDays.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDays([...selectedDays, day.value]);
                            } else {
                              setSelectedDays(selectedDays.filter(d => d !== day.value));
                            }
                          }}
                        />
                      }
                      label={day.short}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}
            
            {tabValue === 1 && specialSchedules.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <FormLabel component="legend" sx={{ mb: 1 }}>Select Special Schedules</FormLabel>
                <FormGroup>
                  {specialSchedules.map(schedule => (
                    <FormControlLabel
                      key={schedule.id}
                      control={
                        <Checkbox
                          checked={selectedSpecialSchedules.includes(schedule.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSpecialSchedules([...selectedSpecialSchedules, schedule.id]);
                            } else {
                              setSelectedSpecialSchedules(selectedSpecialSchedules.filter(s => s !== schedule.id));
                            }
                          }}
                        />
                      }
                      label={`${schedule.name} (${dayjs(schedule.date).format('MMM D, YYYY')})`}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEventDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => tabValue === 0 ? handleAddEvent() : handleAddSpecialEvent()} 
            variant="contained" 
            disabled={!newEventSound || (tabValue === 0 && selectedDays.length === 0) || (tabValue === 1 && selectedSpecialSchedules.length === 0)}
          >
            Add Event {tabValue === 0 && selectedDays.length > 1 ? `(${selectedDays.length} days)` : ''}
            {tabValue === 1 && selectedSpecialSchedules.length > 1 ? `(${selectedSpecialSchedules.length} schedules)` : ''}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={massReplaceDialogOpen} onClose={() => setMassReplaceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mass Replace Sounds</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Sound to Replace</InputLabel>
            <Select value={oldSoundId} onChange={(e) => setOldSoundId(e.target.value)}>
              {audioFiles.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Replace With</InputLabel>
            <Select value={newSoundId} onChange={(e) => setNewSoundId(e.target.value)} disabled={!oldSoundId}>
              {audioFiles.filter(a => a.id !== parseInt(oldSoundId)).map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMassReplaceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMassReplace} variant="contained" disabled={!oldSoundId || !newSoundId}>Replace</Button>
        </DialogActions>
      </Dialog>

      {/* Copy Special Schedule Dialog */}
      <Dialog open={copySpecialScheduleDialogOpen} onClose={() => setCopySpecialScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ContentCopy />
            <Typography variant="h6">Copy Special Schedule</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Create a copy of "{scheduleToCopy?.name}" with all its events. You can rename and modify the copy after creation.
            </Typography>
            <TextField
              fullWidth
              label="New Schedule Name"
              value={copyScheduleForm.name}
              onChange={(e) => setCopyScheduleForm({ ...copyScheduleForm, name: e.target.value })}
              margin="normal"
              required
              helperText="Enter a unique name for the copied schedule"
            />
            <TextField
              fullWidth
              label="Description"
              value={copyScheduleForm.description}
              onChange={(e) => setCopyScheduleForm({ ...copyScheduleForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              helperText="Optional description for the copied schedule"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopySpecialScheduleDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCopySpecialSchedule} 
            variant="contained"
            startIcon={<ContentCopy />}
            disabled={!copyScheduleForm.name.trim()}
          >
            Copy Schedule
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
