import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  MusicNote as MusicNoteIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../api';

export default function CalendarView({ onScheduleChange }) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [defaultSchedule, setDefaultSchedule] = useState(null);
  const [specialSchedules, setSpecialSchedules] = useState([]);
  const [scheduledDates, setScheduledDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedSpecialSchedule, setSelectedSpecialSchedule] = useState('');



  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    try {
      const startDate = currentDate.startOf('month').format('YYYY-MM-DD');
      const endDate = currentDate.endOf('month').format('YYYY-MM-DD');
      
      // Get default schedule
      const schedules = await api.getSchedules();
      const defaultSched = schedules.find(s => s.is_default);
      setDefaultSchedule(defaultSched);
      
      // Get all special schedules (not just scheduled ones)
      try {
        const allSpecialSchedules = await api.getSpecialSchedules();
        console.log('All special schedules:', allSpecialSchedules);
        console.log('Special schedules count:', allSpecialSchedules ? allSpecialSchedules.length : 0);
        setSpecialSchedules(allSpecialSchedules || []);
      } catch (error) {
        console.error('Error loading special schedules:', error);
        setSpecialSchedules([]);
      }
      
      // Get scheduled dates for the current month
      try {
        const scheduledDatesData = await api.getScheduledDatesForCalendar(startDate, endDate);
        console.log('Scheduled dates:', scheduledDatesData);
        setScheduledDates(scheduledDatesData || {});
      } catch (error) {
        console.error('Error loading scheduled dates:', error);
        setScheduledDates({});
      }
      

      
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  const getDaysInMonth = () => {
    const start = currentDate.startOf('month').startOf('week');
    const end = currentDate.endOf('month').endOf('week');
    const days = [];
    let day = start;

    while (day.isBefore(end) || day.isSame(end, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }

    return days;
  };

  const getScheduleForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    
    // Check if there's a special schedule scheduled for this specific date
    if (scheduledDates[dateStr]) {
      const scheduledSchedule = scheduledDates[dateStr];
      const specialSchedule = specialSchedules.find(s => s.id === scheduledSchedule.id);
      if (specialSchedule) {
        return {
          type: 'special',
          schedule: specialSchedule,
          name: specialSchedule.name,
          description: specialSchedule.description || 'Special schedule'
        };
      }
    }
    
    // Check if it's a weekday (Monday-Friday)
    const dayOfWeek = (date.day() + 6) % 7; // Convert to Monday=0
    if (dayOfWeek < 5) {
      return {
        type: 'regular',
        schedule: defaultSchedule,
        name: defaultSchedule?.name || 'Regular Bells',
        description: defaultSchedule?.description || 'Standard school schedule'
      };
    }
    
    return {
      type: 'none',
      schedule: null,
      name: 'No Schedule',
      description: 'Weekend - no bells'
    };
  };

  const isToday = (date) => {
    return date.isSame(dayjs(), 'day');
  };

  const isCurrentMonth = (date) => {
    return date.isSame(currentDate, 'month');
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const currentSchedule = getScheduleForDate(date);
    setSelectedSpecialSchedule(currentSchedule.type === 'special' ? currentSchedule.schedule.id.toString() : '');
    setScheduleDialogOpen(true);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const handleScheduleChange = async () => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.format('YYYY-MM-DD');
    
    try {
      if (selectedSpecialSchedule === '') {
        // Remove special schedule for this specific date (revert to regular)
        await api.unscheduleSpecialScheduleForDate(dateStr);
      } else {
        // Schedule the selected special schedule for this specific date
        await api.scheduleSpecialScheduleForDate(
          parseInt(selectedSpecialSchedule),
          dateStr
        );
      }
      
      setScheduleDialogOpen(false);
      setSelectedDate(null);
      setSelectedSpecialSchedule('');
      loadData();
      
      // Notify parent component that schedule has changed
      if (onScheduleChange) {
        onScheduleChange();
      }
    } catch (error) {
      console.error('Error changing schedule:', error);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.format('YYYY-MM-DD');
    
    try {
      // Remove special schedule for this specific date
      await api.unscheduleSpecialScheduleForDate({ target_date: dateStr });
      
      setScheduleDialogOpen(false);
      setSelectedDate(null);
      setSelectedSpecialSchedule('');
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const getScheduleColor = (scheduleType) => {
    switch (scheduleType) {
      case 'regular': return '#1976d2';
      case 'special': return '#4caf50';
      case 'none': return '#757575';
      default: return '#757575';
    }
  };

  const getScheduleIcon = (scheduleType) => {
    switch (scheduleType) {
      case 'regular': return <ScheduleIcon />;
      case 'special': return <EventIcon />;
      case 'none': return <MusicNoteIcon />;
      default: return <MusicNoteIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Calendar View
      </Typography>

      {/* Calendar Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <IconButton onClick={handlePreviousMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5">
          {currentDate.format('MMMM YYYY')}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Calendar Grid */}
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs={12/7} key={day}>
              <Box sx={{ 
                p: 1, 
                textAlign: 'center', 
                fontWeight: 'bold',
                borderBottom: '1px solid #e0e0e0'
              }}>
                {day}
              </Box>
            </Grid>
          ))}

          {/* Calendar Days */}
          {getDaysInMonth().map((date, index) => {
            const schedule = getScheduleForDate(date);
            const isWeekend = (date.day() + 6) % 7 >= 5;
            
            return (
              <Grid item xs={12/7} key={index}>
                <Box
                  sx={{
                    p: 1,
                    minHeight: 80,
                    border: '1px solid #e0e0e0',
                    backgroundColor: isToday(date) ? '#e3f2fd' : 'white',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                  onClick={() => handleDateClick(date)}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday(date) ? 'bold' : 'normal',
                      color: isCurrentMonth(date) ? 'text.primary' : 'text.secondary',
                      mb: 1
                    }}
                  >
                    {date.format('D')}
                  </Typography>
                  
                  {isCurrentMonth(date) && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        icon={getScheduleIcon(schedule.type)}
                        label={schedule.name}
                        size="small"
                        sx={{
                          backgroundColor: getScheduleColor(schedule.type),
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                      {schedule.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          {schedule.description}
                        </Typography>
                      )}
                      

                    </Box>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Schedule Selection Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Schedule for {selectedDate?.format('dddd, MMMM D, YYYY')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose the schedule for this day:
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Schedule</InputLabel>
            <Select
              value={selectedSpecialSchedule}
              onChange={(e) => setSelectedSpecialSchedule(e.target.value)}
              label="Schedule"
            >
              <MenuItem value="">
                {defaultSchedule?.name || 'Regular Bells'} (Default)
              </MenuItem>
              {specialSchedules.map((special) => (
                <MenuItem key={special.id} value={special.id}>
                  {special.name}
                  {special.description && ` - ${special.description}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Select "Regular Bells" to use the default schedule, or choose a special schedule to override it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteSchedule} color="error">
            Delete Schedule
          </Button>
          <Button onClick={handleScheduleChange} variant="contained">
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
