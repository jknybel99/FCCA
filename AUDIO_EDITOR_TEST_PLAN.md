# Audio Editor Testing Plan

## Overview
The Audio Editor has been updated with the following improvements:
1. **Fixed playback issues** - Improved audio loading and playback reliability
2. **Added Gain/Amplification control** - Permanently boost audio volume (50-200%)
3. **Separated playback volume** - Temporary preview volume control
4. **Better error handling** - Clear error messages and success notifications
5. **DAW-like interface** - Professional audio editing controls

## Features to Test

### 1. Basic Playback
- [ ] Open Audio Library (from Admin Panel or main menu)
- [ ] Click the "Edit" (scissors) icon on any audio file
- [ ] Audio Editor dialog should open
- [ ] Click the Play button (▶️)
- [ ] Audio should play from the trim start position
- [ ] Playhead should move across the waveform
- [ ] Audio should stop at the trim end position
- [ ] Click Pause button to pause playback
- [ ] Click Stop button to stop and reset to trim start

### 2. Trim Selection
- [ ] **Drag handles**: Drag the red "S" (start) and "E" (end) handles to adjust trim points
- [ ] **Click to select**: Click anywhere on the waveform to create a new selection
- [ ] **Time display**: Verify start time, end time, and trimmed duration update correctly
- [ ] **Preview trimmed section**: Click "Preview Trimmed Section" button
  - Should play only the selected portion
  - Should respect playback volume

### 3. Gain/Amplification Control ⭐ NEW
- [ ] **Gain slider**: Adjust the gain slider (50% - 200%)
  - 100% = original volume
  - 150% = 1.5x louder
  - 200% = 2x louder (maximum)
- [ ] **Quick buttons**: Test the quick gain buttons:
  - "Reset" → Sets to 100%
  - "+50%" → Sets to 150%
  - "Max" → Sets to 200%
- [ ] **Use case**: Test with a quiet audio file
  - Set gain to 150% or 200%
  - Click "Preview with Fade Effects" to hear the amplified audio
  - Save and verify the new file is louder

### 4. Playback Volume Control
- [ ] **Playback volume slider**: Adjust playback volume (0-100%)
- [ ] **Real-time adjustment**: Change volume while audio is playing
- [ ] **Verify it's temporary**: This should NOT affect the saved audio
- [ ] **Use case**: Lower playback volume to 50% while testing, then save at 150% gain
  - The saved file should be loud (150% gain), not quiet (50% playback)

### 5. Fade Effects
- [ ] **Fade In**: Set fade in duration (0-5 seconds)
- [ ] **Fade Out**: Set fade out duration (0-5 seconds)
- [ ] **Preview with effects**: Click "Preview with Fade Effects"
  - Should hear fade in at the start
  - Should hear fade out at the end
  - Should respect gain amplification
  - Should respect playback volume

### 6. Save Functionality
- [ ] Set trim points (e.g., 5s - 15s)
- [ ] Set gain to 150% (to boost volume)
- [ ] Set fade in to 1s
- [ ] Set fade out to 2s
- [ ] Click "Save Edited Audio to Server"
- [ ] Should show loading progress
- [ ] Should show success message with new filename
- [ ] Dialog should close after 3 seconds
- [ ] Verify new file appears in Audio Library
- [ ] Play the new file to verify:
  - Duration matches trimmed selection
  - Volume is louder (gain applied)
  - Fade in/out effects are present

### 7. Error Handling
- [ ] Try to save with invalid trim (start >= end) - should show error
- [ ] Try to save with trim < 1 second - should show error
- [ ] Check ffmpeg status warning appears if ffmpeg not available
- [ ] Verify clear error messages for playback failures

## Common Use Cases

### Use Case 1: Boost Quiet Bell Sound
1. Open a quiet bell audio file in the editor
2. Set gain to 180%
3. Preview with fade effects to hear the boost
4. Save the edited file
5. Use the new louder file in schedules

### Use Case 2: Create Short Bell from Long Audio
1. Open a long audio file (e.g., 60 seconds)
2. Click on waveform to select a 5-second section
3. Drag handles to fine-tune the selection
4. Set fade in: 0.5s, fade out: 1s
5. Set gain: 120% (slight boost)
6. Preview to verify
7. Save as new file

### Use Case 3: Quick Trim and Amplify
1. Open audio file
2. Drag end handle to trim to desired length
3. Click "Max" button to set gain to 200%
4. Click "Preview with Fade Effects"
5. If satisfied, click Save

## Backend API Endpoints Used

- `POST /api/audio-editor/trim-preview` - Preview trimmed audio
- `POST /api/audio-editor/fade-preview` - Preview with fade and gain effects
- `POST /api/audio-editor/process-and-save` - Save edited audio
- `GET /api/audio-editor/check-ffmpeg` - Check ffmpeg availability
- `GET /api/sounds/{id}/stream` - Stream audio for playback

## Technical Notes

### Gain vs Playback Volume
- **Gain (50-200%)**: Permanently amplifies the audio signal. This is applied during processing and saved to the file. Use this to make quiet clips louder.
- **Playback Volume (0-100%)**: Temporary volume control for preview only. Does NOT affect the saved audio.

### Audio Processing
- Backend uses ffmpeg for audio processing
- Gain is applied using ffmpeg's `volume` filter
- Formula: `volume={gain/100}` (e.g., 150% gain = volume=1.5)
- Output format: AAC at 192kbps, 44.1kHz, stereo

### Browser Compatibility
- Tested with Chrome/Edge (recommended)
- Firefox should work but may have different audio codec support
- Safari may require additional testing

## Troubleshooting

### Playback doesn't work
- Check browser console for errors
- Verify audio file exists on server
- Check network tab for failed requests
- Try a different audio file

### Gain doesn't seem to work
- Make sure to click "Preview with Fade Effects" (not just "Preview Trimmed Section")
- The fade preview includes gain processing
- Verify ffmpeg is available on the server

### Save fails
- Check ffmpeg is installed: `ffmpeg -version`
- Verify write permissions on `static/sounds/` directory
- Check backend logs for detailed error messages
- Ensure trim times are valid (start < end, duration >= 1s)

## Success Criteria
✅ All playback controls work smoothly
✅ Gain control successfully amplifies quiet audio
✅ Playback volume adjusts preview without affecting saved audio
✅ Trim, fade, and gain effects all work together
✅ Saved files have correct duration, volume, and effects
✅ Error messages are clear and helpful
✅ UI is intuitive and responsive
