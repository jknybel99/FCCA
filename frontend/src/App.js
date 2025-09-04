import React, { useState, useEffect } from "react";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Snackbar,
  Button,
  CssBaseline
} from "@mui/material";
import AudioUpload from "./components/AudioUpload";
import ScheduleManager from "./components/ScheduleManager";
import CalendarView from "./components/CalendarView";
import Dashboard from "./components/Dashboard";
import AudioLibrary from "./components/AudioLibrary";
import TTSManager from "./components/TTSManager";
import AdminPanel from "./components/AdminPanel";
import ScheduleDialog from "./components/ScheduleDialog";
import ScheduleTable from "./components/ScheduleTable";
import api from "./api";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import CloseIcon from '@mui/icons-material/Close';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#fdfcfc',
      paper: '#ffffff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fdfcfc',
        },
      },
    },
  },
});

function App() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [currentTab, setCurrentTab] = useState(0);
  const [adminSettings, setAdminSettings] = useState({
    schoolName: '',
    schoolLogo: '',
    footerText: ''
  });
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const refreshAudio = () => api.getAudioFiles().then(setAudioFiles);
  const refreshSchedules = () => api.getBellEvents().then(setScheduledEvents);

  useEffect(() => {
    refreshAudio();
    refreshSchedules();
    loadAdminSettings();
  }, []);

  const loadAdminSettings = async () => {
    try {
      const settings = await api.getAdminSettings();
      console.log('Loading admin settings:', settings); // Debug log
      console.log('Logo URL:', settings.schoolLogo); // Debug log
      setAdminSettings(settings);
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const handleUploadSuccess = () => {
    refreshAudio();
    setSnackbar({ open: true, message: "Upload successful!" });
  };

  const handlePreview = url => {
    console.log('Setting preview URL:', url);
    setPreviewUrl(url);
  };

  const handleScheduleChange = () => {
    refreshSchedules();
    setScheduleRefreshKey(prev => prev + 1);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <Dashboard key={scheduleRefreshKey} />;
      case 1:
        return <ScheduleManager />;
      case 2:
        return <CalendarView events={scheduledEvents} onPreview={handlePreview} onScheduleChange={handleScheduleChange} />;
      case 3:
        return <AudioLibrary onPreview={handlePreview} />;
      case 4:
        return <TTSManager />;
      case 5:
        return <AdminPanel onSettingsUpdate={loadAdminSettings} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            {adminSettings.schoolLogo && (
              <Box
                component="img"
                src={adminSettings.schoolLogo}
                alt="School Logo"
                sx={{
                  height: 40,
                  width: 'auto',
                  mr: 2,
                  borderRadius: 1
                }}
              />
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {adminSettings.schoolName ? `${adminSettings.schoolName} - School Bell System` : 'School Bell System'}
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, backgroundColor: '#fdfcfc', minHeight: '100vh' }}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange} centered>
              <Tab label="Dashboard" />
              <Tab label="Schedule Manager" />
              <Tab label="Calendar" />
              <Tab label="Audio Library" />
              <Tab label="TTS Manager" />
              <Tab label="Admin Panel" />
            </Tabs>
          </Paper>
          
          {renderTabContent()}

          {/* Footer */}
          <Box sx={{ mt: 6, py: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              {adminSettings.footerText || 'School Bell System - Automated Bell Scheduling'}
            </Typography>
          </Box>
        </Container>

        {/* Preview Dialog */}
        <ScheduleDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          event={editingEvent}
          onSave={handleScheduleChange}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;