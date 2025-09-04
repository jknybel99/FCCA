import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";

export default function ScheduleDialog({ open, onClose, onSave, audioFiles, event }) {
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedTime, setSelectedTime] = useState(dayjs());

  useEffect(() => {
    if (event) {
      setSelectedFile(event.fileId);
      setSelectedTime(dayjs(event.time));
    } else {
      setSelectedFile("");
      setSelectedTime(dayjs());
    }
  }, [event]);

  const handleSave = () => {
    onSave({ id: event?.id, fileId: selectedFile, time: selectedTime.toISOString() });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{event ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
      <DialogContent>
        <TextField
          select
          label="Audio File"
          value={selectedFile}
          onChange={e => setSelectedFile(e.target.value)}
          fullWidth
          margin="normal"
        >
          {audioFiles && audioFiles.map(f => (
            <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
          ))}
        </TextField>
        <DateTimePicker
          label="Time"
          value={selectedTime}
          onChange={setSelectedTime}
          slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}