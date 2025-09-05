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
  CssBaseline,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
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
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const handleMobileTabChange = (tabIndex) => {
    setCurrentTab(tabIndex);
    setMobileMenuOpen(false);
  };

  const getTabItems = () => {
    const items = [
      { label: "Dashboard", icon: <DashboardIcon />, index: 0 },
      { label: "Calendar", icon: <CalendarTodayIcon />, index: 2 }
    ];

    if (isAdmin()) {
      items.splice(1, 0, { label: "Schedule Manager", icon: <ScheduleIcon />, index: 1 });
      items.push(
        { label: "Audio Library", icon: <LibraryMusicIcon />, index: 3 },
        { label: "TTS Manager", icon: <RecordVoiceOverIcon />, index: 4 },
        { label: "Admin Panel", icon: <AdminPanelSettingsIcon />, index: 5 }
      );
    } else {
      items.push({ label: "My Profile", icon: <PersonIcon />, index: 2 });
    }

    return items;
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
            {/* Mobile menu button */}
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* School logo */}
            {adminSettings.schoolLogo && (
              <Box
                component="img"
                src={adminSettings.schoolLogo}
                alt="School Logo"
                sx={{
                  height: isMobile ? 32 : 40,
                  width: 'auto',
                  mr: 2,
                  borderRadius: 1
                }}
              />
            )}

            {/* School name - responsive */}
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontSize: isMobile ? '0.9rem' : '1.25rem',
                lineHeight: 1.2
              }}
            >
              {isMobile 
                ? (adminSettings.schoolName || 'School Bell System')
                : (adminSettings.schoolName ? `${adminSettings.schoolName} - School Bell System` : 'School Bell System')
              }
            </Typography>
            
            {/* User info and logout - responsive */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
              {!isMobile && (
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {user?.username} {user?.is_admin ? '(Admin)' : '(User)'}
                </Typography>
              )}
              
              {isMobile ? (
                <Button 
                  color="inherit" 
                  onClick={handleUserMenuOpen}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {user?.username}
                </Button>
              ) : (
                <Button 
                  color="inherit" 
                  onClick={logout}
                  variant="outlined"
                  size="small"
                >
                  Logout
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Container 
          maxWidth="lg" 
          sx={{ 
            mt: isMobile ? 2 : 4, 
            px: isMobile ? 1 : 3,
            backgroundColor: '#fdfcfc', 
            minHeight: '100vh' 
          }}
        >
          {/* Desktop tabs */}
          {!isMobile && (
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
          )}

          {/* Mobile menu drawer */}
          <Drawer
            anchor="left"
            open={mobileMenuOpen}
            onClose={handleMobileMenuToggle}
            sx={{
              '& .MuiDrawer-paper': {
                width: 280,
                boxSizing: 'border-box',
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                {adminSettings.schoolName || 'School Bell System'}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                {getTabItems().map((item) => (
                  <ListItem
                    button
                    key={item.index}
                    onClick={() => handleMobileTabChange(item.index)}
                    selected={currentTab === item.index}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: currentTab === item.index ? 'white' : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Logged in as: {user?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user?.is_admin ? 'Administrator' : 'User'}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          </Drawer>

          {/* User menu for mobile */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleUserMenuClose}>
              <Typography variant="body2">
                {user?.username} {user?.is_admin ? '(Admin)' : '(User)'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Typography variant="body2" color="error">
                Logout
              </Typography>
            </MenuItem>
          </Menu>
          
          <ProtectedRoute>
            {renderTabContent()}
          </ProtectedRoute>

          {/* Footer */}
          <Box sx={{ 
            mt: isMobile ? 4 : 6, 
            py: isMobile ? 2 : 3, 
            textAlign: 'center', 
            color: 'text.secondary',
            px: isMobile ? 2 : 0
          }}>
            <Typography variant={isMobile ? "caption" : "body2"}>
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