import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import api from '../api';

const PlaylistContext = createContext();

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [isPlaylistPlaying, setIsPlaylistPlaying] = useState(false);
  const [currentTrackName, setCurrentTrackName] = useState('');
  
  const audioRef = useRef(new Audio());
  const playbackTimeoutRef = useRef(null);

  const loadPlaylists = async () => {
    try {
      const data = await api.getPlaylists();
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setPlaylists([]);
    }
  };

  const loadPlaylistItems = async (playlistId) => {
    try {
      const data = await api.getPlaylistItems(playlistId);
      setPlaylistItems(Array.isArray(data) ? data : []);
      setCurrentPlaylistIndex(0);
    } catch (error) {
      console.error('Error loading playlist items:', error);
      setPlaylistItems([]);
    }
  };

  const playCurrentItem = useCallback(async () => {
    if (currentPlaylistIndex >= playlistItems.length) {
      setIsPlaylistPlaying(false);
      return;
    }

    const item = playlistItems[currentPlaylistIndex];
    if (!item) return;

    try {
      // Stop any current playback
      await api.stopStream();
      await api.stopPlaylistAudio();

      if (item.stream_url) {
        // Play stream
        console.log('Playing radio stream via server:', item.stream_url);
        setCurrentTrackName(item.stream_name || 'Radio Stream');
        
        const result = await api.playStream(item.stream_url);
        console.log('✅ Stream started successfully:', result);
        
        // For streams, play indefinitely until manually stopped
        return;
      } else if (item.sound) {
        // Play sound file
        console.log('Playing sound via backend:', item.sound.id, item.sound.name);
        setCurrentTrackName(item.sound.name);
        
        await api.playSoundForPlaylist(item.sound.id);
        console.log('✅ Sound started successfully');

        // Auto-advance after sound duration (estimated)
        const duration = item.sound.duration || 30; // Default 30 seconds if no duration
        playbackTimeoutRef.current = setTimeout(() => {
          playNextItem();
        }, duration * 1000);
      }
    } catch (error) {
      console.error('Error playing item:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Auto-advance on error
      setTimeout(() => playNextItem(), 2000);
    }
  }, [currentPlaylistIndex, playlistItems]);

  const startPlaylist = () => {
    if (playlistItems.length === 0) return;
    setIsPlaylistPlaying(true);
  };

  const stopPlaylist = async () => {
    console.log('🛑 Stopping playlist...');
    try {
      // Clear any pending timeouts
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }

      // Stop server-side playback
      await api.stopStream();
      await api.stopPlaylistAudio();
      
      setIsPlaylistPlaying(false);
      setCurrentTrackName('');
      console.log('✅ Playlist stopped');
    } catch (err) {
      console.error('Error stopping playlist:', err);
    }
  };

  const playNextItem = () => {
    if (currentPlaylistIndex < playlistItems.length - 1) {
      setCurrentPlaylistIndex(prev => prev + 1);
    } else {
      // End of playlist
      stopPlaylist();
    }
  };

  const playPreviousItem = () => {
    if (currentPlaylistIndex > 0) {
      setCurrentPlaylistIndex(prev => prev - 1);
    }
  };

  // Auto-play when index changes and playlist is playing
  React.useEffect(() => {
    if (isPlaylistPlaying && currentPlaylistIndex < playlistItems.length) {
      playCurrentItem();
    }
  }, [currentPlaylistIndex, isPlaylistPlaying, playCurrentItem]);

  // Load playlist items when playlist changes
  React.useEffect(() => {
    if (selectedPlaylist) {
      loadPlaylistItems(selectedPlaylist.id);
    }
  }, [selectedPlaylist]);

  const value = {
    playlists,
    selectedPlaylist,
    playlistItems,
    currentPlaylistIndex,
    isPlaylistPlaying,
    currentTrackName,
    setSelectedPlaylist,
    loadPlaylists,
    startPlaylist,
    stopPlaylist,
    playNextItem,
    playPreviousItem
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};
