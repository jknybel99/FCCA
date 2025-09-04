import React from "react";
import { List, ListItem, ListItemText, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export default function AudioPreview({ files, onPreview }) {
  const handlePreview = (url) => {
    console.log('Playing audio file:', url);
    onPreview(url);
  };

  return (
    <List>
      {files.map(file => (
        <ListItem key={file.id}>
          <ListItemText primary={file.name} />
          <IconButton onClick={() => handlePreview(file.url)}>
            <PlayArrowIcon />
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
}
