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
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import UserProfile from "./components/UserProfile";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
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

function AppContent() {
  const { user, isAuthenticated, logout, isAdmin, loading } = useAuth();
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
    if (isAuthenticated()) {
      refreshAudio();
      refreshSchedules();
      loadAdminSettings();
    }
  }, [isAuthenticated]);

  // Show login if not authenticated
  if (!isAuthenticated()) {
    return <Login />;
  }


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
    // For admin users, use the current tab directly
    // For non-admin users, only allow tabs 0, 1, 2 (Dashboard, Calendar, My Profile)
    if (!isAdmin() && currentTab > 2) {
      setCurrentTab(2); // Redirect to My Profile (last accessible tab)
      return <UserProfile />;
    }

    if (isAdmin()) {
      // Admin users have all tabs
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
    } else {
      // Regular users have limited tabs
      switch (currentTab) {
        case 0:
          return <Dashboard key={scheduleRefreshKey} />;
        case 1:
          return <CalendarView events={scheduledEvents} onPreview={handlePreview} onScheduleChange={handleScheduleChange} />;
        case 2:
          return <UserProfile />;
        default:
          return <Dashboard />;
      }
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
            
            {/* User info and logout */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {user?.username} {user?.is_admin ? '(Admin)' : '(User)'}
              </Typography>
              <Button 
                color="inherit" 
                onClick={logout}
                variant="outlined"
                size="small"
              >
                Logout
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, backgroundColor: '#fdfcfc', minHeight: '100vh' }}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange} centered>
              <Tab label="Dashboard" />
              {isAdmin() && <Tab label="Schedule Manager" />}
              <Tab label="Calendar" />
              {!isAdmin() && <Tab label="My Profile" />}
              {isAdmin() && <Tab label="Audio Library" />}
              {isAdmin() && <Tab label="TTS Manager" />}
              {isAdmin() && <Tab label="Admin Panel" />}
            </Tabs>
          </Paper>
          
          <ProtectedRoute>
            {renderTabContent()}
          </ProtectedRoute>

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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;