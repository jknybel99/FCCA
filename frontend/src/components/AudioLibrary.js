import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Avatar,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Fade,
  Zoom
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Search as SearchIcon,
  MusicNote as MusicNoteIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Upload as UploadIcon,
  ContentCut as CutIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  Label as LabelIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import AudioUpload from './AudioUpload';
import AudioEditorV2 from './AudioEditorV2';
import api from '../api';

const SOUND_TYPES = [
  { value: 'bell', label: 'Bell', icon: <ScheduleIcon />, color: '#f44336' },
  { value: 'music', label: 'Music', icon: <MusicNoteIcon />, color: '#2196f3' },
  { value: 'announcement', label: 'Announcement', icon: <NotificationsIcon />, color: '#4caf50' },
  { value: 'tts', label: 'Text-to-Speech', icon: <NotificationsIcon />, color: '#ff9800' }
];

export default function AudioLibrary() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    type: '',
    tags: ''
  });
  const [viewMode, setViewMode] = useState('table'); // 'grid', 'list', or 'table'
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [sortBy, setSortBy] = useState('created_at'); // 'name', 'created_at', or 'type'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [selectedYear, setSelectedYear] = useState('all'); // 'all' or specific year

  useEffect(() => {
    loadAudioFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [audioFiles, selectedType, searchQuery, sortBy, sortOrder, selectedYear]);

  const loadAudioFiles = async () => {
    try {
      const files = await api.getAudioFiles();
      setAudioFiles(files);
    } catch (error) {
      console.error('Error loading audio files:', error);
    }
  };

  const filterFiles = () => {
    let filtered = audioFiles;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(file => file.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        (file.description && file.description.toLowerCase().includes(query)) ||
        (file.tags && file.tags.toLowerCase().includes(query))
      );
    }

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(file => {
        if (!file.created_at) return false;
        const fileYear = new Date(file.created_at).getFullYear().toString();
        return fileYear === selectedYear;
      });
    }

    // Sort files
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === 'created_at') {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        compareValue = dateA - dateB;
      } else if (sortBy === 'type') {
        compareValue = a.type.localeCompare(b.type);
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredFiles(filtered);
  };

  const handleUploadSuccess = () => {
    loadAudioFiles();
    setUploadDialogOpen(false);
  };

  const handleEditFile = (file) => {
    setSelectedFile(file);
    setEditForm({
      name: file.name,
      description: file.description || '',
      type: file.type || 'music',
      tags: file.tags || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.updateSound(selectedFile.id, editForm);
      setEditDialogOpen(false);
      setSelectedFile(null);
      loadAudioFiles();
    } catch (error) {
      console.error('Error updating sound:', error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.deleteSound(fileId);
        loadAudioFiles();
      } catch (error) {
        console.error('Error deleting sound:', error);
      }
    }
  };

  const handleEditAudio = (file) => {
    setEditingFile(file);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingFile(null);
  };

  const handleEditorSave = () => {
    setEditorOpen(false);
    setEditingFile(null);
    // Optionally reload audio files if needed
  };

  const handlePlayFile = async (fileId) => {
    if (playingAudio === fileId) {
      // Stop audio
      try {
        await api.stopAllAudio();
        setPlayingAudio(null);
      } catch (error) {
        console.error('Error stopping sound:', error);
        setPlayingAudio(null);
      }
      return;
    }
    
    try {
      setPlayingAudio(fileId);
      await api.playSound(fileId);
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (playingAudio === fileId) {
          setPlayingAudio(null);
        }
      }, 5000);
    } catch (error) {
      console.error('Error playing sound:', error);
      setPlayingAudio(null);
    }
  };

  const getTypeIcon = (type) => {
    const soundType = SOUND_TYPES.find(t => t.value === type);
    return soundType ? soundType.icon : <MusicNoteIcon />;
  };

  const getTypeColor = (type) => {
    const soundType = SOUND_TYPES.find(t => t.value === type);
    return soundType ? soundType.color : '#757575';
  };

  const getTypeLabel = (type) => {
    const soundType = SOUND_TYPES.find(t => t.value === type);
    return soundType ? soundType.label : 'Unknown';
  };

  const getStats = () => {
    const stats = {
      total: audioFiles.length,
      bell: audioFiles.filter(f => f.type === 'bell').length,
      music: audioFiles.filter(f => f.type === 'music').length,
      announcement: audioFiles.filter(f => f.type === 'announcement').length,
      tts: audioFiles.filter(f => f.type === 'tts').length
    };
    return stats;
  };

  const stats = getStats();

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending for dates, ascending for names/type
      setSortBy(column);
      setSortOrder(column === 'created_at' ? 'desc' : 'asc');
    }
  };

  const getAvailableYears = () => {
    const years = new Set();
    audioFiles.forEach(file => {
      if (file.created_at) {
        const year = new Date(file.created_at).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Descending order
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // If the timestamp doesn't have a 'Z' or timezone offset, assume it's UTC
    let date;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('T')) {
      // Just a date without time, treat as is
      date = new Date(dateString);
    } else if (!dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
      // Has time but no timezone indicator - assume UTC
      date = new Date(dateString + 'Z');
    } else {
      // Already has timezone info
      date = new Date(dateString);
    }
    
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const SortableHeader = ({ column, children }) => (
    <Box 
      onClick={() => handleSort(column)}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5,
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': {
          opacity: 0.8
        }
      }}
    >
      {children}
      {sortBy === column && (
        sortOrder === 'asc' ? 
          <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : 
          <ArrowDownwardIcon sx={{ fontSize: 14 }} />
      )}
    </Box>
  );

  // Render audio card for grid view
  const renderAudioCard = (file) => (
    <Box sx={{ 
      border: '1px solid', 
      borderColor: 'divider',
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: 'primary.main',
        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)'
      }
    }}
    >
      <CardContent sx={{ flexGrow: 1, p: 1.5, pb: 1 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Chip
            label={getTypeLabel(file.type)}
            size="small"
            sx={{ 
              height: 20,
              fontSize: '0.7rem',
              backgroundColor: getTypeColor(file.type) + '15',
              color: getTypeColor(file.type),
              border: `1px solid ${getTypeColor(file.type)}40`
            }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handlePlayFile(file.id)}
              sx={{ 
                width: 28, 
                height: 28,
                color: playingAudio === file.id ? 'secondary.main' : 'success.main',
                '&:hover': { bgcolor: playingAudio === file.id ? 'secondary.light' : 'success.light' }
              }}
            >
              {playingAudio === file.id ? <StopIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>

        {/* File Name */}
        <Tooltip title={file.name}>
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontWeight: 700,
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.875rem'
            }}
          >
            {file.name}
          </Typography>
        </Tooltip>

        {/* Description */}
        {file.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 1
            }}
          >
            {file.description}
          </Typography>
        )}

        {/* Duration & Tags */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 14 }} />
            {file.duration ? `${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')}` : '-'}
          </Typography>
          {file.tags && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {file.tags.split(',').length} tag{file.tags.split(',').length > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Card Actions */}
      <Box sx={{ 
        borderTop: '1px solid', 
        borderColor: 'divider', 
        px: 1, 
        py: 0.5,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 0.5
      }}>
        <Tooltip title="Edit Info">
          <IconButton 
            size="small" 
            onClick={() => handleEditFile(file)} 
            sx={{ 
              width: 28, 
              height: 28,
              color: 'primary.main',
              '&:hover': { bgcolor: 'primary.light', color: 'primary.dark' }
            }}
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Audio">
          <IconButton 
            size="small" 
            onClick={() => handleEditAudio(file)} 
            sx={{ 
              width: 28, 
              height: 28,
              color: 'info.main',
              '&:hover': { bgcolor: 'info.light', color: 'info.dark' }
            }}
          >
            <CutIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton 
            size="small" 
            onClick={() => handleDeleteFile(file.id)} 
            sx={{ 
              width: 28, 
              height: 28,
              color: 'error.main',
              '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
            }}
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  // Render audio list item for list view
  const renderAudioListItem = (file) => (
    <Box 
      key={file.id}
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      {/* Type Badge */}
      <Chip
        label={getTypeLabel(file.type)}
        size="small"
        sx={{ 
          height: 22,
          fontSize: '0.7rem',
          minWidth: 80,
          backgroundColor: getTypeColor(file.type) + '15',
          color: getTypeColor(file.type),
          border: `1px solid ${getTypeColor(file.type)}40`
        }}
      />

      {/* File Info */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {file.name}
        </Typography>
        {file.description && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {file.description}
          </Typography>
        )}
      </Box>

      {/* Tags */}
      {file.tags && (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
          {file.tags.split(',').slice(0, 2).map((tag, index) => (
            <Chip 
              key={index} 
              label={tag.trim()} 
              size="small" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          ))}
          {file.tags.split(',').length > 2 && (
            <Chip 
              label={`+${file.tags.split(',').length - 2}`}
              size="small" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
      )}

      {/* Duration */}
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50, textAlign: 'right' }}>
        {file.duration ? `${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')}` : '-'}
      </Typography>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => handlePlayFile(file.id)}
          sx={{ 
            width: 32, 
            height: 32,
            color: playingAudio === file.id ? 'secondary.main' : 'success.main',
            '&:hover': { bgcolor: playingAudio === file.id ? 'secondary.light' : 'success.light' }
          }}
        >
          {playingAudio === file.id ? <StopIcon sx={{ fontSize: 18 }} /> : <PlayIcon sx={{ fontSize: 18 }} />}
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleEditFile(file)} 
          sx={{ 
            width: 32, 
            height: 32,
            color: 'primary.main',
            '&:hover': { bgcolor: 'primary.light', color: 'primary.dark' }
          }}
        >
          <EditIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleEditAudio(file)} 
          sx={{ 
            width: 32, 
            height: 32,
            color: 'info.main',
            '&:hover': { bgcolor: 'info.light', color: 'info.dark' }
          }}
        >
          <CutIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleDeleteFile(file.id)} 
          sx={{ 
            width: 32, 
            height: 32,
            color: 'error.main',
            '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
          }}
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Audio Library
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stats.total} files • {stats.bell} bells • {stats.music} music • {stats.announcement + stats.tts} announcements
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          Upload
        </Button>
      </Box>

      {/* Filters and View Toggle */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            label="Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            {SOUND_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            label="Year"
          >
            <MenuItem value="all">All Years</MenuItem>
            {getAvailableYears().map((year) => (
              <MenuItem key={year} value={year.toString()}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="table">
            <ListViewIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="grid">
            <GridViewIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Audio Files Display */}
      {filteredFiles.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
          <MusicNoteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {searchQuery || selectedType !== 'all' 
              ? 'No files match your search criteria' 
              : 'No audio files uploaded yet'}
          </Typography>
          {!searchQuery && selectedType === 'all' && (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Upload Audio
            </Button>
          )}
        </Box>
      ) : viewMode === 'table' ? (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: '100px 1fr 120px 180px 80px 200px',
            gap: 1,
            p: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderBottom: '2px solid',
            borderColor: 'primary.dark',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}>
            <SortableHeader column="type">TYPE</SortableHeader>
            <SortableHeader column="name">NAME</SortableHeader>
            <Box>DURATION</Box>
            <SortableHeader column="created_at">UPLOADED</SortableHeader>
            <Box>PLAY</Box>
            <Box>ACTIONS</Box>
          </Box>
          {filteredFiles.map((file, index) => (
            <Box
              key={file.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 120px 180px 80px 200px',
                gap: 1,
                p: 1,
                alignItems: 'center',
                borderBottom: index < filteredFiles.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                fontSize: '0.813rem',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              <Chip
                label={getTypeLabel(file.type)}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: getTypeColor(file.type) + '15',
                  color: getTypeColor(file.type),
                  border: `1px solid ${getTypeColor(file.type)}40`
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </Typography>
                {file.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.description}
                  </Typography>
                )}
                {file.tags && (
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {file.tags.split(',').slice(0, 3).map((tag, i) => (
                      <Chip key={i} label={tag.trim()} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.65rem' }} />
                    ))}
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {file.duration ? `${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')}` : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {formatDate(file.created_at)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handlePlayFile(file.id)}
                sx={{
                  width: 32,
                  height: 32,
                  color: playingAudio === file.id ? 'secondary.main' : 'success.main',
                  '&:hover': { bgcolor: playingAudio === file.id ? 'secondary.light' : 'success.light' }
                }}
              >
                {playingAudio === file.id ? <StopIcon sx={{ fontSize: 18 }} /> : <PlayIcon sx={{ fontSize: 18 }} />}
              </IconButton>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Edit Info">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditFile(file)} 
                    sx={{ 
                      width: 28, 
                      height: 28,
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'primary.light', color: 'primary.dark' }
                    }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Audio">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditAudio(file)} 
                    sx={{ 
                      width: 28, 
                      height: 28,
                      color: 'info.main',
                      '&:hover': { bgcolor: 'info.light', color: 'info.dark' }
                    }}
                  >
                    <CutIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteFile(file.id)} 
                    sx={{ 
                      width: 28, 
                      height: 28,
                      color: 'error.main',
                      '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredFiles.map((file) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} xl={2} key={file.id}>
              {renderAudioCard(file)}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          {filteredFiles.map((file) => renderAudioListItem(file))}
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Audio Files</DialogTitle>
        <DialogContent>
          <AudioUpload onSuccess={handleUploadSuccess} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit File Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Audio File</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              label="Type"
            >
              {SOUND_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={editForm.tags}
            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            margin="normal"
            helperText="Enter tags separated by commas (e.g., morning, bell, primary)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Audio Editor Dialog */}
      <AudioEditorV2
        open={editorOpen}
        onClose={handleEditorClose}
        audioFile={editingFile}
        onSave={handleEditorSave}
      />
    </Box>
  );
}
