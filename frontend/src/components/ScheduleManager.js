import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import api from '../api';

export default function ScheduleManager() {
  const [defaultSchedule, setDefaultSchedule] = useState(null);
  const [scheduleDays, setScheduleDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [specialSchedules, setSpecialSchedules] = useState([]);
  const [specialEvents, setSpecialEvents] = useState({});
  const [audioFiles, setAudioFiles] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  
  // Weekly view states
  const [weeklyViewExpanded, setWeeklyViewExpanded] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  
  // Regular schedule states
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState('');
  const [eventForm, setEventForm] = useState({
    time: dayjs().hour(8).minute(0),
    sound_id: '',
    tts_text: '',
    description: '',
    repeat_tag: '',
    is_active: true
  });
  
  // Special schedule states
  const [specialScheduleDialogOpen, setSpecialScheduleDialogOpen] = useState(false);
  const [specialEventDialogOpen, setSpecialEventDialogOpen] = useState(false);
  const [selectedSpecialSchedule, setSelectedSpecialSchedule] = useState(null);
  const [selectedSpecialDay, setSelectedSpecialDay] = useState(null);
  const [selectedSpecialEvent, setSelectedSpecialEvent] = useState(null);
  const [specialScheduleForm, setSpecialScheduleForm] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [specialEventForm, setSpecialEventForm] = useState({
    time: dayjs().hour(8).minute(0),
    sound_id: '',
    tts_text: '',
    description: '',
    repeat_tag: '',
    is_active: true
  });
  
  // Copy dialog states
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedEventToCopy, setSelectedEventToCopy] = useState(null);
  const [selectedDaysToCopy, setSelectedDaysToCopy] = useState([]);
  
  // Replace all dialog states
  const [replaceAllDialogOpen, setReplaceAllDialogOpen] = useState(false);
  const [selectedEventToReplace, setSelectedEventToReplace] = useState(null);
  const [selectedNewSoundForAll, setSelectedNewSoundForAll] = useState('');
  
  // Multi-day event dialog states
  const [multiDayEventDialogOpen, setMultiDayEventDialogOpen] = useState(false);
  const [selectedDaysForEvent, setSelectedDaysForEvent] = useState([]);
  
  // Schedule edit dialog states
  const [scheduleEditDialogOpen, setScheduleEditDialogOpen] = useState(false);
  const [scheduleEditForm, setScheduleEditForm] = useState({
    name: '',
    description: ''
  });
  
  // Calendar functionality states
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedSpecialScheduleForDate, setSelectedSpecialScheduleForDate] = useState('');
  const [activeSpecialSchedules, setActiveSpecialSchedules] = useState([]);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(null);
  const [specialScheduleSelectorOpen, setSpecialScheduleSelectorOpen] = useState(false);
  
  // Feedback states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedules, specialData, audioData] = await Promise.all([
        api.getSchedules(),
        api.getSpecialSchedules(),
        api.getAudioFiles()
      ]);
      
      const defaultSched = schedules.find(s => s.is_default);
      setDefaultSchedule(defaultSched);
      
      if (defaultSched) {
        const days = await api.getScheduleDays(defaultSched.id);
        setScheduleDays(days);
        
        const allEvents = [];
        for (const day of days) {
          const dayEvents = await api.getBellEventsByDay(day.id);
          allEvents.push(...dayEvents.map(event => ({
            ...event,
            schedule_day: day
          })));
        }
        setEvents(allEvents);
      }
      
      setSchedules(schedules);
      setSpecialSchedules(specialData);
      setAudioFiles(audioData);
      setAllSchedules(schedules);
      
      // Load special bell events separately and store them in a separate state
      // This will be used by the special schedule display functions
      const specialEventsData = {};
      for (const special of specialData) {
        try {
          const specialBellEvents = await api.getSpecialBellEvents(special.id);
          console.log(`Loaded ${specialBellEvents.length} events for special schedule ${special.id}:`, specialBellEvents);
          specialEventsData[special.id] = specialBellEvents;
        } catch (error) {
          console.warn(`Could not load events for special schedule ${special.id}:`, error);
          specialEventsData[special.id] = [];
        }
      }
      // Store special events in a separate state variable
      console.log('Setting special events:', specialEventsData);
      setSpecialEvents(specialEventsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Regular schedule functions
  const handleCreateEvent = async () => {
    console.log('=== handleCreateEvent called ===');
    console.log('editingEvent:', editingEvent);
    console.log('selectedScheduleDay:', selectedScheduleDay);
    console.log('eventForm:', eventForm);
    
    // Check if we have the required data for the current mode
    if (editingEvent) {
      console.log('Mode: EDITING existing event');
      // We're editing - no need to check selectedScheduleDay
      try {
        await handleEditEvent();
      } catch (error) {
        console.error('Error updating event:', error);
        showSnackbar('Error updating event', 'error');
      }
    } else {
      console.log('Mode: CREATING new event');
      // We're creating a new event - need a schedule day
    if (!selectedScheduleDay) {
        console.log('ERROR: No schedule day selected');
      showSnackbar('Please select a schedule day', 'error');
      return;
    }
    
      // Check if description is provided
      if (!eventForm.description || eventForm.description.trim() === '') {
        console.log('ERROR: No description provided');
        showSnackbar('Description is required', 'error');
        return;
      }
      
      console.log('Creating event with data:', {
        schedule_day_id: selectedScheduleDay,
        time: eventForm.time.format('HH:mm:ss'),
        description: eventForm.description,
        sound_id: eventForm.sound_id || null,
        tts_text: eventForm.tts_text || null,
        repeat_tag: eventForm.repeat_tag,
        is_active: true
      });
      
      try {
        // Create new event
        const result = await api.createBellEvent({
          schedule_day_id: selectedScheduleDay,
          time: eventForm.time.format('HH:mm:ss'),
        description: eventForm.description,
          sound_id: eventForm.sound_id || null,
          tts_text: eventForm.tts_text || null,
        repeat_tag: eventForm.repeat_tag,
          is_active: true
      });
        
        console.log('Event created successfully:', result);
      
      setEventDialogOpen(false);
      setEventForm({
        time: dayjs().hour(8).minute(0),
        sound_id: '',
        tts_text: '',
        description: '',
        repeat_tag: '',
        is_active: true
      });
      setSelectedScheduleDay('');
      loadData();
      showSnackbar('Event created successfully');
    } catch (error) {
      console.error('Error creating event:', error);
        console.error('Error details:', error.response?.data || error.message);
      showSnackbar('Error creating event', 'error');
      }
    }
  };

  const handleDeleteEvent = async (mergedEvent) => {
    try {
      // Delete all instances of this event across all days
      const deletePromises = mergedEvent.days.map(day => {
        // Find the actual event instance for this day
        const eventInstance = events.find(event => 
          event.schedule_day && 
          event.schedule_day.id === day.id &&
          event.time === mergedEvent.time &&
          event.sound_id === mergedEvent.sound_id &&
          event.description === mergedEvent.description &&
          event.repeat_tag === mergedEvent.repeat_tag
        );
        return eventInstance ? api.deleteBellEvent(eventInstance.id) : Promise.resolve();
      });
      
      await Promise.all(deletePromises);
      loadData();
      showSnackbar('Event deleted from all days successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      showSnackbar('Error deleting event', 'error');
    }
  };

  const handleCopyEvent = async () => {
    try {
      await api.copyBellEvent({
        event_id: selectedEventToCopy.id,
        target_day_ids: selectedDaysToCopy
      });
      setCopyDialogOpen(false);
      setSelectedEventToCopy(null);
      setSelectedDaysToCopy([]);
      loadData();
      showSnackbar('Event copied successfully');
    } catch (error) {
      console.error('Error copying event:', error);
      showSnackbar('Error copying event', 'error');
    }
  };

  const openCopyDialog = (event) => {
    setSelectedEventToCopy(event);
    setCopyDialogOpen(true);
  };

  // Event editing functions
  const openEditEventDialog = (mergedEvent) => {
    // Store the merged event for editing
    setEditingEvent(mergedEvent);
    
    // Find the first event instance to populate the form
    const firstEvent = events.find(event => 
      event.schedule_day && 
      event.schedule_day.id === mergedEvent.days[0].id &&
      event.time === mergedEvent.time &&
      event.sound_id === mergedEvent.sound_id &&
      event.description === mergedEvent.description &&
      event.repeat_tag === mergedEvent.repeat_tag
    );
    
    if (firstEvent) {
      setEventForm({
        time: dayjs(`2000-01-01 ${firstEvent.time}`),
        sound_id: firstEvent.sound_id || '',
        tts_text: firstEvent.tts_text || '',
        description: firstEvent.description || '',
        repeat_tag: firstEvent.repeat_tag || '',
        is_active: firstEvent.is_active
      });
      setEventDialogOpen(true);
    }
  };

  const handleEditEvent = async () => {
    if (!editingEvent) return;
    
    console.log('=== handleEditEvent called ===');
    console.log('editingEvent:', editingEvent);
    console.log('Current eventForm:', eventForm);
    console.log('Available events:', events);
    
    try {
      // Update all instances of this event across all days
      const updatePromises = editingEvent.days.map(day => {
        console.log('Processing day:', day);
        
        // Find the actual event instance for this day using the original event data
        const eventInstance = events.find(event => 
          event.schedule_day && 
          event.schedule_day.id === day.id &&
          event.time === editingEvent.time &&
          event.sound_id === editingEvent.sound_id &&
          event.description === editingEvent.description &&
          event.repeat_tag === editingEvent.repeat_tag
        );
        
        console.log('Found event instance:', eventInstance);
        
        if (eventInstance) {
          // Update with the new form values
          const updateData = {
            sound_id: eventForm.sound_id || null,
            tts_text: eventForm.tts_text || null,
            description: eventForm.description,
            repeat_tag: eventForm.repeat_tag,
            is_active: eventForm.is_active
          };
          
          console.log('Updating event:', eventInstance.id, 'with data:', updateData);
          
          return api.updateBellEvent(eventInstance.id, updateData);
        }
        return Promise.resolve();
      });
      
      console.log('All update promises:', updatePromises);
      await Promise.all(updatePromises);
      console.log('All updates completed successfully');
      
      setEventDialogOpen(false);
      setEditingEvent(null);
      setEventForm({
        time: dayjs().hour(8).minute(0),
        sound_id: '',
        tts_text: '',
        description: '',
        repeat_tag: '',
        is_active: true
      });
      setSelectedScheduleDay('');
      loadData();
      showSnackbar('Event updated successfully across all days');
    } catch (error) {
      console.error('Error updating event:', error);
      console.error('Error details:', error.response?.data || error.message);
      showSnackbar('Error updating event', 'error');
    }
  };

  // Schedule edit functions
  const openScheduleEditDialog = () => {
    if (defaultSchedule) {
      setScheduleEditForm({
        name: defaultSchedule.name || '',
        description: defaultSchedule.description || ''
      });
      setScheduleEditDialogOpen(true);
    }
  };

  const handleScheduleEdit = async () => {
    try {
      if (defaultSchedule) {
        await api.updateSchedule(defaultSchedule.id, scheduleEditForm);
        setScheduleEditDialogOpen(false);
        loadData();
        showSnackbar('Schedule updated successfully');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      showSnackbar('Error updating schedule', 'error');
    }
  };

  // Special schedule functions
  const handleCreateSpecialSchedule = async () => {
    try {
      const specialSchedule = await api.createSpecialSchedule({
        name: specialScheduleForm.name,
        description: specialScheduleForm.description,
        schedule_id: defaultSchedule?.id || 1,
        is_active: specialScheduleForm.is_active
      });
      
      setSpecialScheduleDialogOpen(false);
      setSpecialScheduleForm({
        name: '',
        description: '',
        is_active: true
      });
      loadData();
      showSnackbar('Special schedule created successfully');
    } catch (error) {
      console.error('Error creating special schedule:', error);
      showSnackbar('Error creating special schedule', 'error');
    }
  };

  const handleCreateSpecialEvent = async () => {
    if (!selectedSpecialSchedule) {
      showSnackbar('Please select a special schedule', 'error');
      return;
    }
    
    if (!specialEventForm.description || specialEventForm.description.trim() === '') {
      showSnackbar('Description is required', 'error');
      return;
    }
    
    try {
      const eventData = {
        time: specialEventForm.time.format('HH:mm:ss'),
        sound_id: specialEventForm.sound_id || null,
        tts_text: specialEventForm.tts_text || null,
        description: specialEventForm.description,
        repeat_tag: specialEventForm.repeat_tag,
        is_active: specialEventForm.is_active
      };
      
      if (selectedSpecialEvent) {
        // Update existing event
        await api.updateSpecialBellEvent(selectedSpecialEvent.id, eventData);
        showSnackbar('Special event updated successfully');
      } else {
        // Create new event
        console.log('Creating special event with data:', eventData);
        const result = await api.createSpecialBellEvent(selectedSpecialSchedule.id, eventData);
        console.log('Special event created successfully:', result);
        showSnackbar('Special event created successfully');
      }
      
      setSpecialEventDialogOpen(false);
      setSpecialEventForm({
        time: dayjs().hour(8).minute(0),
        sound_id: '',
        tts_text: '',
        description: '',
        repeat_tag: '',
        is_active: true
      });
      setSelectedSpecialSchedule(null);
      setSelectedSpecialEvent(null);
      console.log('Calling loadData() to refresh...');
      loadData();
    } catch (error) {
      console.error('Error saving special event:', error);
      showSnackbar('Error saving special event', 'error');
    }
  };

  const handleDeleteSpecialEvent = async (eventId) => {
    try {
      await api.deleteSpecialBellEvent(eventId);
      loadData();
      showSnackbar('Special event deleted successfully');
    } catch (error) {
      console.error('Error deleting special event:', error);
      showSnackbar('Error deleting special event', 'error');
    }
  };

  const getMergedEvents = (events) => {
    const merged = {};
    events.forEach(event => {
      const key = `${event.time}_${event.sound_id || 'tts'}_${event.description || ''}_${event.repeat_tag || ''}`;
      if (!merged[key]) {
        merged[key] = {
          ...event,
          days: []
        };
      }
      merged[key].days.push(event.schedule_day);
    });
    return Object.values(merged);
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek];
  };

  const getEventsForDay = (dayOfWeek) => {
    // Get events for a specific day of week (0=Monday, 6=Sunday)
    const dayEvents = [];
    
    // Get regular schedule events for this day
    if (schedules.length > 0) {
      const defaultSchedule = schedules[0]; // Assuming first schedule is default
      const scheduleDay = defaultSchedule.days?.find(day => day.day_of_week === dayOfWeek);
      if (scheduleDay) {
        const dayEventList = events.filter(event => 
          event.schedule_day && event.schedule_day.id === scheduleDay.id
        );
        dayEvents.push(...dayEventList);
      }
    }
    
    // Get special schedule events for this day
    // Since special schedules now use date-specific scheduling, we need to check
    // if any special events are scheduled for today or if they override this day
    const today = new Date();
    const dayOfWeekToday = (today.getDay() + 6) % 7; // Convert to Monday=0
    
    specialSchedules.forEach(special => {
      // Check if this special schedule is active for today
      if (special.scheduled_dates && special.scheduled_dates.length > 0) {
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const isActiveToday = special.scheduled_dates.includes(todayStr);
        
        // If this special schedule is active today and it's the same day of week,
        // or if it's a special event that should be shown
        if (isActiveToday && dayOfWeek === dayOfWeekToday) {
          // Get special events for this schedule from the separate state
          const specialEventList = specialEvents[special.id] || [];
          dayEvents.push(...specialEventList);
        }
      }
    });
    
    return dayEvents.sort((a, b) => a.time.localeCompare(b.time));
  };

  const getSpecialScheduleForDay = (dayOfWeek) => {
    // Check if there's an active special schedule for this day
    // Since special schedules now use date-specific scheduling, we need to check
    // if any special schedule is active for today
    const today = new Date();
    const dayOfWeekToday = (today.getDay() + 6) % 7; // Convert to Monday=0
    
    for (const special of specialSchedules) {
      // Check if this special schedule is active for today
      if (special.scheduled_dates && special.scheduled_dates.length > 0) {
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const isActiveToday = special.scheduled_dates.includes(todayStr);
        
        // If this special schedule is active today and it's the same day of week
        if (isActiveToday && dayOfWeek === dayOfWeekToday) {
          return special;
        }
      }
    }
    return null;
  };

  const handleOpenSpecialScheduleSelector = (dayOfWeek) => {
    // This will open a dialog to select a special schedule for the specific day
    setSelectedDayOfWeek(dayOfWeek);
    setSpecialScheduleSelectorOpen(true);
  };

  const handleDeactivateSpecialSchedule = async (dayOfWeek) => {
    try {
      const special = getSpecialScheduleForDay(dayOfWeek);
      if (special) {
        // Call the backend to deactivate the special schedule for this day
        await api.deactivateSpecialScheduleForDay(special.id, dayOfWeek);
        showSnackbar(`Special schedule "${special.name}" deactivated for ${getDayName(dayOfWeek)}`, 'success');
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error deactivating special schedule:', error);
      showSnackbar('Error deactivating special schedule', 'error');
    }
  };

  const handleCreateMultiDayEvent = async () => {
    if (selectedDaysForEvent.length === 0) {
      showSnackbar('Please select at least one day', 'error');
      return;
    }
    
    if (!eventForm.description || eventForm.description.trim() === '') {
      showSnackbar('Description is required', 'error');
      return;
    }
    
    try {
      // Create the same event for all selected days
      for (const dayId of selectedDaysForEvent) {
        await api.createBellEvent({
          schedule_day_id: dayId,
          time: eventForm.time.format('HH:mm:ss'),
          description: eventForm.description,
          sound_id: eventForm.sound_id || null,
          tts_text: eventForm.tts_text || null,
          repeat_tag: eventForm.repeat_tag,
          is_active: true
        });
      }
      
      setMultiDayEventDialogOpen(false);
      setEventForm({
        time: dayjs().hour(8).minute(0),
        sound_id: '',
        tts_text: '',
        description: '',
        repeat_tag: '',
        is_active: true
      });
      setSelectedDaysForEvent([]);
      loadData();
      showSnackbar(`Event created successfully on ${selectedDaysForEvent.length} day(s)`);
    } catch (error) {
      console.error('Error creating multi-day event:', error);
      showSnackbar('Error creating multi-day event', 'error');
    }
  };

  const handleDeleteSpecialSchedule = async (scheduleId) => {
    try {
      await api.deleteSpecialSchedule(scheduleId);
      loadData();
      showSnackbar('Special schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting special schedule:', error);
      showSnackbar('Error deleting special schedule', 'error');
    }
  };

  const handlePlayAudio = async (soundId) => {
    if (playingAudio === soundId) {
      // Stop audio
      setPlayingAudio(null);
      return;
    }
    
    try {
      setPlayingAudio(soundId);
      await api.playAudio(soundId);
      // Auto-stop after 5 seconds
      setTimeout(() => setPlayingAudio(null), 5000);
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(null);
    }
  };

  const handleReplaceSound = async (eventId, newSoundId) => {
    try {
      await api.updateBellEvent(eventId, { sound_id: newSoundId });
      loadData();
      showSnackbar('Sound replaced successfully');
    } catch (error) {
      console.error('Error replacing sound:', error);
      showSnackbar('Error replacing sound', 'error');
    }
  };

  const handleReplaceAllSimilarSounds = async (eventId, newSoundId) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;
      
      // Find all events with the same sound_id and replace them
      const similarEvents = events.filter(e => e.sound_id === event.sound_id);
      for (const similarEvent of similarEvents) {
        await api.updateBellEvent(similarEvent.id, { sound_id: newSoundId });
      }
      loadData();
      showSnackbar(`Replaced sound in ${similarEvents.length} events successfully`);
    } catch (error) {
      console.error('Error replacing similar sounds:', error);
      showSnackbar('Error replacing similar sounds', 'error');
    }
  };

  const handleReplaceAllSimilarSoundsFromDialog = async () => {
    if (!selectedNewSoundForAll || !selectedEventToReplace) return;
    
    try {
      await handleReplaceAllSimilarSounds(selectedEventToReplace.id, selectedNewSoundForAll);
      setReplaceAllDialogOpen(false);
      setSelectedEventToReplace(null);
      setSelectedNewSoundForAll('');
    } catch (error) {
      console.error('Error replacing all similar sounds:', error);
      showSnackbar('Error replacing all similar sounds', 'error');
    }
  };

  const getEventsByDay = () => {
    const eventsByDay = {};
    scheduleDays.forEach(day => {
      const dayEvents = events.filter(event => event.schedule_day_id === day.id);
      eventsByDay[day.day_of_week] = {
        day,
        events: dayEvents.sort((a, b) => a.time.localeCompare(b.time))
      };
    });
    return eventsByDay;
  };

  // Calendar functions for special schedule activation
  const handleOpenCalendar = () => {
    setCalendarDialogOpen(true);
    setSelectedDate(dayjs());
    setSelectedSpecialScheduleForDate('');
  };

  const handleActivateSpecialSchedule = async () => {
    if (!selectedSpecialScheduleForDate) {
      showSnackbar('Please select a special schedule', 'error');
      return;
    }

    console.log('=== handleActivateSpecialSchedule called ===');
    console.log('selectedSpecialScheduleForDate:', selectedSpecialScheduleForDate);
    console.log('selectedDate:', selectedDate.format('YYYY-MM-DD'));
    console.log('selectedDate type:', typeof selectedDate.format('YYYY-MM-DD'));

    try {
      // Call the backend to activate the special schedule
      console.log('Calling api.scheduleSpecialScheduleForDate...');
      const response = await api.scheduleSpecialScheduleForDate(
        parseInt(selectedSpecialScheduleForDate),
        selectedDate.format('YYYY-MM-DD')
      );
      console.log('API response:', response);
      
      const specialSchedule = specialSchedules.find(s => s.id === parseInt(selectedSpecialScheduleForDate));
      if (specialSchedule) {
        showSnackbar(`Special schedule "${specialSchedule.name}" activated for ${selectedDate.format('MMM DD, YYYY')}`, 'success');
        setCalendarDialogOpen(false);
        
        // Refresh the data to show the changes
        console.log('Refreshing data...');
        await loadData();
        console.log('Data refresh completed');
      }
    } catch (error) {
      console.error('Error activating special schedule:', error);
      console.error('Error details:', error.response?.data || error.message);
      showSnackbar('Error activating special schedule', 'error');
    }
  };



  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Schedule Manager
      </Typography>

      {!defaultSchedule ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" color="error">
              No default schedule found. Please contact the administrator to set up the default "Regular Bells" schedule.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Regular Schedule Section */}
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box 
                sx={{ 
                  mb: 3, 
                  pb: 2,
                  borderBottom: '2px solid #1565c0',
                  backgroundColor: '#1565c0',
                  p: 2,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <ScheduleIcon sx={{ fontSize: 28, color: 'white' }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'white' }}>
                Regular Bells Schedule
              </Typography>
                  <Typography variant="body2" sx={{ color: '#e3f2fd' }}>
                {defaultSchedule.description || 'Standard school schedule'}
              </Typography>
                </Box>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    onClick={() => setWeeklyViewExpanded(!weeklyViewExpanded)}
                    startIcon={<ExpandMoreIcon sx={{ 
                      transform: weeklyViewExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }} />}
                  >
                    {weeklyViewExpanded ? 'Hide' : 'Show'} Detailed Weekly View
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={openScheduleEditDialog}
                  >
                    Edit Schedule
                  </Button>
                </Box>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setMultiDayEventDialogOpen(true)}
                  >
                    Add Multi-Day Event
                  </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setEventDialogOpen(true)}
                >
                  Add Event
                </Button>
                </Box>
              </Box>

              {/* Detailed Weekly View */}
              {weeklyViewExpanded && (
                <Accordion defaultExpanded sx={{ mb: 3 }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                    sx={{ 
                      backgroundColor: '#576b80',
                      borderBottom: '1px solid #24293f',
                      '&:hover': { backgroundColor: '#4a5d73' }
                    }}
                  >
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      Detailed Weekly Schedule
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, backgroundColor: '#fafafa' }}>
                    <Grid container spacing={1}>
                      {Object.entries(getEventsByDay()).map(([dayOfWeek, { day, events }]) => (
                        <Grid item xs={12} md={6} lg={4} key={dayOfWeek}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              height: '100%',
                              border: '1px solid #1976d2',
                              backgroundColor: 'white',
                              '&:hover': {
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                borderColor: '#1976d2'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 1.5 }}>
                              {/* Day Header */}
                              <Box 
                                sx={{ 
                                  mb: 1.5, 
                                  pb: 1,
                                  pt: 1,
                                  px: 1.5,
                                  mx: -1.5,
                                  mt: -1.5,
                                  backgroundColor: '#24293f',
                                  borderRadius: '4px 4px 0 0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <Typography 
                                  variant="subtitle1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: 'white'
                                  }}
                                >
                                  {getDayName(parseInt(dayOfWeek))}
                                </Typography>
                                <Chip 
                                  label={`${events.length} event${events.length !== 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: 'white',
                                    color: '#24293f',
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              </Box>
                              
                              {/* Events List */}
                              {events.length === 0 ? (
                                <Box 
                                  sx={{ 
                                    textAlign: 'center', 
                                    py: 3,
                                    color: '#999'
                                  }}
                                >
                                  <Typography variant="body2">
                                    No events scheduled
                                  </Typography>
                                </Box>
                              ) : (
                                <List dense sx={{ p: 0 }}>
                                  {events.map((event) => (
                                    <ListItem 
                                      key={event.id} 
                                      sx={{ 
                                        px: 1, 
                                        py: 0.5,
                                        mb: 0.25,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 0.5,
                                        '&:hover': {
                                          borderColor: '#1976d2',
                                          backgroundColor: '#f8f9fa'
                                        }
                                      }}
                                    >
                                      <ListItemText
                                        primary={
                                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                            <Chip 
                                              label={dayjs(`2000-01-01 ${event.time}`).format('hh:mm:ss A')}
                                              size="small"
                                              sx={{ 
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '0.65rem',
                                                height: 18
                                              }}
                                            />
                                            {event.sound?.description && (
                                              <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                  color: '#1976d2',
                                                  fontWeight: 500
                                                }}
                                              >
                                                {event.sound.description}
                                              </Typography>
                                            )}
                                          </Box>
                                        }
                                        secondary={
                                          <Box>
                                            {/* Line 2: Song name, play, delete, replace dropdown */}
                                            {event.sound && (
                                              <Box 
                                                display="flex" 
                                                alignItems="center" 
                                                gap={0.5}
                                                sx={{ mb: 0.25 }}
                                              >
                                                <Typography 
                                                  variant="caption" 
                                                  sx={{ 
                                                    color: '#666',
                                                    fontWeight: 400,
                                                    flex: 1
                                                  }}
                                                >
                                                  {event.sound.name}
                                                </Typography>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handlePlayAudio(event.sound.id)}
                                                  sx={{ 
                                                    color: playingAudio === event.sound.id ? '#d32f2f' : '#666',
                                                    p: 0.25,
                                                    '&:hover': {
                                                      backgroundColor: playingAudio === event.sound.id ? '#ffebee' : '#f5f5f5'
                                                    }
                                                  }}
                                                >
                                                  {playingAudio === event.sound.id ? <StopIcon /> : <PlayIcon />}
                                                </IconButton>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handleDeleteEvent(event.id)}
                                                  sx={{ 
                                                    color: '#999',
                                                    p: 0.25,
                                                    '&:hover': {
                                                      backgroundColor: '#ffebee',
                                                      color: '#d32f2f'
                                                    }
                                                  }}
                                                >
                                                  <DeleteIcon />
                                                </IconButton>
                                                <FormControl size="small" sx={{ minWidth: 70 }}>
                                                  <Select
                                                    value=""
                                                    displayEmpty
                                                    onChange={(e) => {
                                                      if (e.target.value === 'replace_all') {
                                                        setSelectedEventToReplace(event);
                                                        setReplaceAllDialogOpen(true);
                                                      } else if (e.target.value) {
                                                        handleReplaceSound(event.id, e.target.value);
                                                      }
                                                    }}
                                                    renderValue={() => 'Replace'}
                                                    sx={{
                                                      fontSize: '0.65rem',
                                                      '& .MuiSelect-select': {
                                                        py: 0.2,
                                                        px: 0.4
                                                      }
                                                    }}
                                                  >
                                                    <MenuItem value="" disabled>Replace Sound</MenuItem>
                                                    <MenuItem value="replace_all" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                                                      Replace All Similar
                                                    </MenuItem>
                                                    <Divider />
                                                    {audioFiles.map((audio) => (
                                                      <MenuItem key={audio.id} value={audio.id}>
                                                        <Box>
                                                          <Typography variant="body2">{audio.name}</Typography>
                                                          {audio.description && (
                                                            <Typography variant="caption" color="text.secondary">
                                                              {audio.description}
                                                            </Typography>
                                                          )}
                                                        </Box>
                                                      </MenuItem>
                                                    ))}
                                                  </Select>
                                                </FormControl>
                                              </Box>
                                            )}
                                            
                                            {/* TTS Text */}
                                            {event.tts_text && (
                                              <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                  color: '#666',
                                                  backgroundColor: '#fff3e0',
                                                  px: 0.4,
                                                  py: 0.2,
                                                  borderRadius: 0.2,
                                                  display: 'block'
                                                }}
                                              >
                                                TTS: {event.tts_text}
                                              </Typography>
                                            )}
                                            
                                            {/* No Audio */}
                                            {!event.sound && !event.tts_text && (
                                              <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                  color: '#999',
                                                  fontStyle: 'italic'
                                                }}
                                              >
                                                No audio specified
                                              </Typography>
                                            )}
                                          </Box>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }}>Event</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }}>Days</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getMergedEvents(events).map((event) => (
                      <TableRow key={`${event.id}_${event.days[0]?.id}`}>
                        <TableCell>
                          <Chip 
                            label={dayjs(`2000-01-01 ${event.time}`).format('hh:mm:ss A')}
                            size="small"
                            sx={{ 
                              backgroundColor: '#1976d2',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {event.description ? (
                            <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
                              {event.description}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No description
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {event.sound?.description && (
                            <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 500 }} display="block">
                              {event.sound.description}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            {event.sound?.name || event.tts_text || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {event.days.map((day, index) => (
                            <Chip
                              key={day.id}
                              label={getDayName(day.day_of_week)}
                              size="small"
                              sx={{ 
                                mr: 0.5, 
                                mb: 0.5,
                                backgroundColor: '#576b80',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openEditEventDialog(event)}
                            title="Edit event"
                            sx={{ 
                              color: '#1976d2',
                              '&:hover': {
                                backgroundColor: '#e3f2fd'
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openCopyDialog(event)}
                            title="Copy to other days"
                            sx={{ 
                              color: '#1976d2',
                              '&:hover': {
                                backgroundColor: '#e3f2fd'
                              }
                            }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEvent(event)}
                            title="Delete event from all days"
                            sx={{ 
                              color: '#d32f2f',
                              '&:hover': {
                                backgroundColor: '#ffebee'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Special Event Schedules Section */}
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box 
                sx={{ 
                  mb: 3, 
                  pb: 2,
                  borderBottom: '2px solid #1b5e20',
                  backgroundColor: '#1b5e20',
                  p: 2,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <EventIcon sx={{ fontSize: 28, color: 'white' }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'white' }}>
                Special Event Schedules
              </Typography>
                  <Typography variant="body2" sx={{ color: '#c8e6c9' }}>
                Create special schedules for assemblies, extended periods, or other special events
              </Typography>
                </Box>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Manage Schedules
                </Typography>
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<EventIcon />}
                    onClick={handleOpenCalendar}
                  >
                    Calendar View
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete all non-default schedules? This action cannot be undone.')) {
                        // TODO: Implement bulk schedule deletion
                        showSnackbar('Schedule deletion feature coming soon', 'info');
                      }
                    }}
                  >
                    Delete All Schedules
                  </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setSpecialScheduleDialogOpen(true)}
                >
                  Create Special Schedule
                </Button>
                </Box>
              </Box>

              {specialSchedules.map((special) => (
                <Accordion key={special.id} sx={{ mb: 2 }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      backgroundColor: '#fafafa',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                          {special.name}
                        </Typography>
                    {special.description && (
                          <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                        {special.description}
                      </Typography>
                    )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete the special schedule "${special.name}"?`)) {
                            handleDeleteSpecialSchedule(special.id);
                          }
                        }}
                        sx={{ 
                          mr: 1,
                          color: '#999',
                          '&:hover': {
                            backgroundColor: '#ffebee',
                            color: '#d32f2f'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ backgroundColor: '#fafafa', p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSelectedSpecialSchedule(special);
                          setSelectedSpecialEvent(null);
                          setSpecialEventForm({
                            time: dayjs().hour(8).minute(0),
                            sound_id: '',
                            tts_text: '',
                            description: '',
                            repeat_tag: '',
                            is_active: true
                          });
                          setSpecialEventDialogOpen(true);
                        }}
                        sx={{ 
                          borderColor: '#ccc',
                          color: '#666',
                          '&:hover': {
                            borderColor: '#999',
                            backgroundColor: '#f5f5f5'
                          }
                        }}
                      >
                        Add Bell Event
                      </Button>
                    </Box>
                    
                    <List>
                      {specialEvents[special.id]?.map((event) => (
                        <ListItem 
                          key={event.id}
                          sx={{ 
                            px: 1,
                            py: 0.5,
                            mb: 0.25,
                            border: '1px solid #e0e0e0',
                            borderRadius: 0.5,
                            '&:hover': {
                              borderColor: '#1b5e20',
                              backgroundColor: '#f8f9fa'
                            }
                          }}
                        >
                            <ListItemText
                                                            primary={
                                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                    <Chip 
                                      label={dayjs(`2000-01-01 ${event.time}`).format('hh:mm:ss A')}
                                      size="small"
                                      sx={{ 
                                        backgroundColor: '#1b5e20',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.65rem',
                                        height: 18
                                      }}
                                    />
                                    {/* Event Description */}
                                    {event.description && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: '#1976d2',
                                          fontWeight: 600,
                                          backgroundColor: '#e3f2fd',
                                          px: 0.8,
                                          py: 0.2,
                                          borderRadius: 0.5,
                                          border: '1px solid #bbdefb'
                                        }}
                                      >
                                        {event.description}
                                      </Typography>
                                    )}
                                    {/* Audio File Description */}
                                    {event.sound?.description && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: '#1b5e20',
                                          fontWeight: 500
                                        }}
                                      >
                                        {event.sound.description}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    {/* Line 2: Song name, play, edit, delete */}
                                    {event.sound && (
                                      <Box 
                                        display="flex" 
                                        alignItems="center" 
                                        gap={0.5}
                                        sx={{ mb: 0.25 }}
                                      >
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            color: '#666',
                                            fontWeight: 400,
                                            flex: 1
                                          }}
                                        >
                                          {event.sound.name}
                                        </Typography>
                                        <IconButton
                                          size="small"
                                          onClick={() => handlePlayAudio(event.sound.id)}
                                          sx={{ 
                                            color: playingAudio === event.sound.id ? '#d32f2f' : '#666',
                                            p: 0.25,
                                            '&:hover': {
                                              backgroundColor: playingAudio === event.sound.id ? '#ffebee' : '#f5f5f5'
                                            }
                                          }}
                                        >
                                          {playingAudio === event.sound.id ? <StopIcon /> : <PlayIcon />}
                                        </IconButton>
                                        <IconButton
                                size="small"
                                onClick={() => {
                                            setSelectedSpecialEvent(event);
                                            setSelectedSpecialSchedule(special);
                                            setSpecialEventForm({
                                              time: dayjs(`2000-01-01 ${event.time}`),
                                              sound_id: event.sound_id || '',
                                              tts_text: event.tts_text || '',
                                              description: event.description || '',
                                              repeat_tag: event.repeat_tag || '',
                                              is_active: event.is_active
                                            });
                                  setSpecialEventDialogOpen(true);
                                }}
                                          sx={{ 
                                            color: '#666',
                                            p: 0.25,
                                            '&:hover': {
                                              backgroundColor: '#e3f2fd',
                                              color: '#1976d2'
                                            }
                                          }}
                                        >
                                          <EditIcon />
                                        </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteSpecialEvent(event.id)}
                                          sx={{ 
                                            color: '#999',
                                            p: 0.25,
                                            '&:hover': {
                                              backgroundColor: '#ffebee',
                                              color: '#d32f2f'
                                            }
                                          }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                                      </Box>
                                    )}
                                    
                                    {/* TTS Text */}
                                    {event.tts_text && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: '#666',
                                          backgroundColor: '#fff3e0',
                                          px: 0.4,
                                          py: 0.2,
                                          borderRadius: 0.2,
                                          display: 'block'
                                        }}
                                      >
                                        TTS: {event.tts_text}
                                      </Typography>
                                    )}
                                    
                                    {/* No Audio */}
                                    {!event.sound && !event.tts_text && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: '#999',
                                          fontStyle: 'italic'
                                        }}
                                      >
                                        No audio specified
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                          {(!specialEvents[special.id] || specialEvents[special.id].length === 0) && (
                            <ListItem 
                              sx={{ 
                                textAlign: 'center',
                                backgroundColor: '#f9f9f9',
                                borderRadius: 0.5,
                                border: '1px dashed #ccc'
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                                    No events scheduled
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" sx={{ color: '#999' }}>
                                    Click 'Add Bell Event' to create the first event
                                  </Typography>
                                }
                              />
                            </ListItem>
                          )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Regular Event Dialog */}
      <Dialog open={eventDialogOpen} onClose={() => {
        setEventDialogOpen(false);
        setEditingEvent(null);
        setEventForm({
          time: dayjs().hour(8).minute(0),
          sound_id: '',
          tts_text: '',
          description: '',
          repeat_tag: '',
          is_active: true
        });
        setSelectedScheduleDay('');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEvent ? 'Edit Bell Event' : 'Add Bell Event'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Schedule Day</InputLabel>
            <Select
              value={selectedScheduleDay}
              onChange={(e) => setSelectedScheduleDay(e.target.value)}
              label="Schedule Day"
              disabled={editingEvent}
              helperText={editingEvent ? "Event will be updated across all days" : ""}
            >
              {scheduleDays.map((day) => (
                <MenuItem key={day.id} value={day.id}>
                  {getDayName(day.day_of_week)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TimePicker
            label="Time"
            value={eventForm.time}
            onChange={(newValue) => setEventForm({ ...eventForm, time: newValue })}
            slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
            views={['hours', 'minutes', 'seconds']}
            format="hh:mm:ss A"
          />
          {editingEvent && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Time cannot be changed when editing existing events
            </Typography>
          )}

          <TextField
            fullWidth
            label="Description *"
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            margin="normal"
            placeholder="e.g., 1st Period, Passing Period, Morning Bell"
            required
            error={!eventForm.description}
            helperText={!eventForm.description ? "Description is required" : ""}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Audio File (Optional)</InputLabel>
            <Select
              value={eventForm.sound_id}
              onChange={(e) => setEventForm({ ...eventForm, sound_id: e.target.value })}
              label="Audio File (Optional)"
            >
              <MenuItem value="">No audio file</MenuItem>
              {audioFiles.map((file) => (
                <MenuItem key={file.id} value={file.id}>
                  <Box>
                    <Typography variant="body2">{file.name}</Typography>
                    {file.description && (
                      <Typography variant="caption" color="text.secondary">
                        {file.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="TTS Text (Optional)"
            value={eventForm.tts_text}
            onChange={(e) => setEventForm({ ...eventForm, tts_text: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            helperText="Text-to-speech announcement (leave empty if using audio file)"
          />

          <TextField
            fullWidth
            label="Repeat Tag (Optional)"
            value={eventForm.repeat_tag}
            onChange={(e) => setEventForm({ ...eventForm, repeat_tag: e.target.value })}
            margin="normal"
            placeholder="e.g., period_bell, passing_bell"
          />

          <FormControlLabel
            control={
              <Switch
                checked={eventForm.is_active}
                onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })}
              />
            }
            label="Active"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateEvent} variant="contained">
            {editingEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Special Schedule Dialog */}
      <Dialog open={specialScheduleDialogOpen} onClose={() => setSpecialScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Special Event Schedule</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Schedule Name"
            value={specialScheduleForm.name}
            onChange={(e) => setSpecialScheduleForm({ ...specialScheduleForm, name: e.target.value })}
            margin="normal"
            placeholder="e.g., Assembly Schedule, Extended Periods"
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            value={specialScheduleForm.description}
            onChange={(e) => setSpecialScheduleForm({ ...specialScheduleForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            placeholder="Description of when this schedule is used"
          />

          <FormControlLabel
            control={
              <Switch
                checked={specialScheduleForm.is_active}
                onChange={(e) => setSpecialScheduleForm({ ...specialScheduleForm, is_active: e.target.checked })}
              />
            }
            label="Active"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSpecialScheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSpecialSchedule} variant="contained">Create Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Special Event Dialog */}
      <Dialog open={specialEventDialogOpen} onClose={() => setSpecialEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedSpecialEvent ? 'Edit' : 'Add'} Special Bell Event</DialogTitle>
        <DialogContent>
          <TimePicker
            label="Time"
            value={specialEventForm.time}
            onChange={(newValue) => setSpecialEventForm({ ...specialEventForm, time: newValue })}
            slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
            views={['hours', 'minutes', 'seconds']}
            format="hh:mm:ss A"
          />

          <TextField
            fullWidth
            label="Description *"
            value={specialEventForm.description}
            onChange={(e) => setSpecialEventForm({ ...specialEventForm, description: e.target.value })}
            margin="normal"
            placeholder="e.g., Morning Bell, Assembly Start"
            required
            error={!specialEventForm.description}
            helperText={!specialEventForm.description ? "Description is required" : ""}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Audio File (Optional)</InputLabel>
            <Select
              value={specialEventForm.sound_id}
              onChange={(e) => setSpecialEventForm({ ...specialEventForm, sound_id: e.target.value })}
              label="Audio File (Optional)"
            >
              <MenuItem value="">No audio file</MenuItem>
              {audioFiles.map((file) => (
                <MenuItem key={file.id} value={file.id}>
                  <Box>
                    <Typography variant="body2">{file.name}</Typography>
                    {file.description && (
                      <Typography variant="caption" color="text.secondary">
                        {file.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="TTS Text (Optional)"
            value={specialEventForm.tts_text}
            onChange={(e) => setSpecialEventForm({ ...specialEventForm, tts_text: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            helperText="Text-to-speech announcement (leave empty if using audio file)"
          />

          <TextField
            fullWidth
            label="Repeat Tag (Optional)"
            value={specialEventForm.repeat_tag}
            onChange={(e) => setSpecialEventForm({ ...specialEventForm, repeat_tag: e.target.value })}
            margin="normal"
            placeholder="e.g., assembly_bell, extended_period"
          />

          <FormControlLabel
            control={
              <Switch
                checked={specialEventForm.is_active}
                onChange={(e) => setSpecialEventForm({ ...specialEventForm, is_active: e.target.checked })}
              />
            }
            label="Active"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSpecialEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSpecialEvent} variant="contained">
            {selectedSpecialEvent ? 'Update' : 'Create'} Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Event Dialog */}
      <Dialog open={copyDialogOpen} onClose={() => setCopyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Copy Event to Other Days</DialogTitle>
        <DialogContent>
          {selectedEventToCopy && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Copy "{selectedEventToCopy.description || 'Bell Event'}" at {dayjs(`2000-01-01 ${selectedEventToCopy.time}`).format('hh:mm:ss A')} to:
            </Typography>
          )}
          
          <FormControl fullWidth>
            <InputLabel>Select Days</InputLabel>
            <Select
              multiple
              value={selectedDaysToCopy}
              onChange={(e) => setSelectedDaysToCopy(e.target.value)}
              label="Select Days"
            >
              {scheduleDays.map((day) => (
                <MenuItem key={day.id} value={day.id}>
                  {getDayName(day.day_of_week)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCopyEvent} variant="contained">Copy Event</Button>
        </DialogActions>
      </Dialog>

      {/* Replace All Similar Sounds Dialog */}
      <Dialog open={replaceAllDialogOpen} onClose={() => setReplaceAllDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Replace All Similar Sounds</DialogTitle>
        <DialogContent>
          {selectedEventToReplace && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Replace all events using "{selectedEventToReplace.sound?.name || 'this sound'}" with:
            </Typography>
          )}
          
          <FormControl fullWidth>
            <InputLabel>Select New Sound</InputLabel>
            <Select
              value={selectedNewSoundForAll}
              onChange={(e) => setSelectedNewSoundForAll(e.target.value)}
              label="Select New Sound"
            >
              <MenuItem value="">No audio file</MenuItem>
              {audioFiles.map((audio) => (
                <MenuItem key={audio.id} value={audio.id}>
                  <Box>
                    <Typography variant="body2">{audio.name}</Typography>
                    {audio.description && (
                      <Typography variant="caption" color="text.secondary">
                        {audio.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplaceAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReplaceAllSimilarSoundsFromDialog} variant="contained">Replace All</Button>
        </DialogActions>
      </Dialog>

      {/* Multi-Day Event Dialog */}
      <Dialog open={multiDayEventDialogOpen} onClose={() => setMultiDayEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Multi-Day Event</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Days</InputLabel>
            <Select
              multiple
              value={selectedDaysForEvent}
              onChange={(e) => setSelectedDaysForEvent(e.target.value)}
              label="Select Days"
            >
              {scheduleDays.map((day) => (
                <MenuItem key={day.id} value={day.id}>
                  {getDayName(day.day_of_week)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TimePicker
            label="Time"
            value={eventForm.time}
            onChange={(newValue) => setEventForm({ ...eventForm, time: newValue })}
            slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
            views={['hours', 'minutes', 'seconds']}
            format="hh:mm:ss A"
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            margin="normal"
            placeholder="e.g., 1st Period, Passing Period"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Audio File (Optional)</InputLabel>
            <Select
              value={eventForm.sound_id}
              onChange={(e) => setEventForm({ ...eventForm, sound_id: e.target.value })}
              label="Audio File (Optional)"
            >
              <MenuItem value="">No audio file</MenuItem>
              {audioFiles.map((file) => (
                <MenuItem key={file.id} value={file.id}>
                  <Box>
                    <Typography variant="body2">{file.name}</Typography>
                    {file.description && (
                      <Typography variant="caption" color="text.secondary">
                        {file.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="TTS Text (Optional)"
            value={eventForm.tts_text}
            onChange={(e) => setEventForm({ ...eventForm, tts_text: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            helperText="Text-to-speech announcement (leave empty if using audio file)"
          />

          <TextField
            fullWidth
            label="Repeat Tag (Optional)"
            value={eventForm.repeat_tag}
            onChange={(e) => setEventForm({ ...eventForm, repeat_tag: e.target.value })}
            margin="normal"
            placeholder="e.g., period_bell, passing_bell"
          />

          <FormControlLabel
            control={
              <Switch
                checked={eventForm.is_active}
                onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })}
              />
            }
            label="Active"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMultiDayEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateMultiDayEvent} variant="contained">Create Multi-Day Event</Button>
        </DialogActions>
      </Dialog>

      {/* Calendar Dialog for Special Schedule Activation */}
      <Dialog open={calendarDialogOpen} onClose={() => setCalendarDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EventIcon />
            <Typography variant="h6">Calendar View - Schedule Management</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              View and manage schedules for each day. Special schedules override regular schedules when activated.
            </Typography>
            
            {/* Calendar Grid */}
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                {Array.from({ length: 7 }, (_, index) => {
                  const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index];
                  const dayEvents = getEventsForDay(index);
                  const specialSchedule = getSpecialScheduleForDay(index);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ 
                        border: '1px solid #e0e0e0',
                        backgroundColor: specialSchedule ? '#fff3e0' : '#ffffff',
                        '&:hover': { boxShadow: 2 }
                      }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            color: specialSchedule ? '#f57c00' : '#333',
                            mb: 1
                          }}>
                            {dayName}
                          </Typography>
                          
                          {/* Schedule Type Indicator */}
                          <Box sx={{ mb: 2 }}>
                            {specialSchedule ? (
                              <Chip 
                                label={`Special: ${specialSchedule.name}`}
                                size="small"
                                color="warning"
                                sx={{ mb: 1 }}
                              />
                            ) : (
                              <Chip 
                                label="Regular Schedule"
                                size="small"
                                color="primary"
                                sx={{ mb: 1 }}
                              />
                            )}
                          </Box>

                          {/* Events List */}
                          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                            {dayEvents.length > 0 ? (
                              dayEvents.map((event, eventIndex) => (
                                <Box key={eventIndex} sx={{ 
                                  mb: 1, 
                                  p: 1, 
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: 1,
                                  border: '1px solid #e0e0e0'
                                }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                    {dayjs(`2000-01-01 ${event.time}`).format('hh:mm:ss A')}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {event.description || event.sound?.description || event.tts_text || 'Unknown'}
                                  </Typography>
                                  {event.sound?.name && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {event.sound.name}
                                    </Typography>
                                  )}
                                </Box>
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No events scheduled
                              </Typography>
                            )}
                          </Box>

                          {/* Schedule Actions */}
                          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {!specialSchedule ? (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenSpecialScheduleSelector(index)}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                Activate Special
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => handleDeactivateSpecialSchedule(index)}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                Deactivate
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {/* Special Schedule Activation Section */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Activate Special Schedule for Specific Date
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Select Date"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Special Schedule</InputLabel>
                    <Select
                      value={selectedSpecialScheduleForDate}
                      onChange={(e) => setSelectedSpecialScheduleForDate(e.target.value)}
                      label="Special Schedule"
                    >
                      <MenuItem value="">Select a special schedule</MenuItem>
                      {specialSchedules.map((schedule) => (
                        <MenuItem key={schedule.id} value={schedule.id}>
                          <Box>
                            <Typography variant="body2">{schedule.name}</Typography>
                            {schedule.description && (
                              <Typography variant="caption" color="text.secondary">
                                {schedule.description}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button 
                    onClick={handleActivateSpecialSchedule} 
                    variant="contained"
                    disabled={!selectedSpecialScheduleForDate}
                    fullWidth
                  >
                    Activate Special Schedule
                  </Button>
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Note:</strong> This will override the regular bell schedule for the selected date. 
                The special schedule's events will be used instead of the regular schedule.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Special Schedule Selector Dialog */}
      <Dialog open={specialScheduleSelectorOpen} onClose={() => setSpecialScheduleSelectorOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ScheduleIcon />
            <Typography variant="h6">Select Special Schedule for {getDayName(selectedDayOfWeek)}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Choose a special schedule to activate for {getDayName(selectedDayOfWeek)}. This will override the regular schedule.
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Special Schedule</InputLabel>
              <Select
                value={selectedSpecialScheduleForDate}
                onChange={(e) => setSelectedSpecialScheduleForDate(e.target.value)}
                label="Special Schedule"
              >
                <MenuItem value="">Select a special schedule</MenuItem>
                {specialSchedules.map((schedule) => (
                  <MenuItem key={schedule.id} value={schedule.id}>
                    <Box>
                      <Typography variant="body2">{schedule.name}</Typography>
                      {schedule.description && (
                        <Typography variant="caption" color="text.secondary">
                          {schedule.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Note:</strong> This will override the regular bell schedule for {getDayName(selectedDayOfWeek)}. 
              The special schedule's events will be used instead of the regular schedule.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSpecialScheduleSelectorOpen(false)}>Cancel</Button>
          <Button 
            onClick={async () => {
              if (selectedSpecialScheduleForDate) {
                // Activate the special schedule for the specific day of week
                try {
                  await api.activateSpecialScheduleForDay(
                    parseInt(selectedSpecialScheduleForDate),
                    selectedDayOfWeek
                  );
                  const special = specialSchedules.find(s => s.id === parseInt(selectedSpecialScheduleForDate));
                  if (special) {
                    showSnackbar(`Special schedule "${special.name}" activated for ${getDayName(selectedDayOfWeek)}`, 'success');
                    setSpecialScheduleSelectorOpen(false);
                    setSelectedSpecialScheduleForDate('');
                    loadData();
                  }
                } catch (error) {
                  console.error('Error activating special schedule:', error);
                  showSnackbar('Error activating special schedule', 'error');
                }
              }
            }} 
            variant="contained"
            disabled={!selectedSpecialScheduleForDate}
          >
            Activate Special Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Edit Dialog */}
      <Dialog open={scheduleEditDialogOpen} onClose={() => setScheduleEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon />
            <Typography variant="h6">Edit Schedule</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Schedule Name"
              value={scheduleEditForm.name}
              onChange={(e) => setScheduleEditForm({ ...scheduleEditForm, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={scheduleEditForm.description}
              onChange={(e) => setScheduleEditForm({ ...scheduleEditForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScheduleEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
