import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import dayjs from "dayjs";

export default function ScheduleTable({ events, onEdit, onDelete, onPreview }) {
  return (
    <Table sx={{ mt: 3 }}>
      <TableHead>
        <TableRow>
          <TableCell>Time</TableCell>
          <TableCell>Audio File</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {events.map(ev => (
          <TableRow key={ev.id}>
            <TableCell>{ev.time}</TableCell>
            <TableCell>{ev.sound?.name || 'Unknown'}</TableCell>
            <TableCell>
              <IconButton onClick={() => onPreview(ev.sound?.url)}><PlayArrowIcon /></IconButton>
              <IconButton onClick={() => onEdit(ev)}><EditIcon /></IconButton>
              <IconButton onClick={() => onDelete(ev.id)}><DeleteIcon /></IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}