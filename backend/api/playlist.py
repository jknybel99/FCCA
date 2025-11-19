from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal
import crud, schemas, models

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Playlist)
def create_playlist(
    playlist: schemas.PlaylistCreate,
    db: Session = Depends(get_db)
):
    """Create a new playlist"""
    try:
        # TODO: Get user_id from auth token
        created_by = None  # For now, set to None
        
        db_playlist = crud.create_playlist(
            db=db,
            name=playlist.name,
            description=playlist.description,
            created_by=created_by
        )
        return db_playlist
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating playlist: {str(e)}")

@router.get("/", response_model=List[schemas.Playlist])
def get_playlists(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all playlists"""
    try:
        playlists = crud.get_playlists(db, skip=skip, limit=limit)
        return playlists
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching playlists: {str(e)}")

@router.get("/{playlist_id}", response_model=schemas.Playlist)
def get_playlist(
    playlist_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific playlist"""
    playlist = crud.get_playlist(db, playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@router.put("/{playlist_id}", response_model=schemas.Playlist)
def update_playlist(
    playlist_id: int,
    playlist_update: schemas.PlaylistUpdate,
    db: Session = Depends(get_db)
):
    """Update a playlist"""
    try:
        updated_playlist = crud.update_playlist(
            db=db,
            playlist_id=playlist_id,
            name=playlist_update.name,
            description=playlist_update.description,
            is_active=playlist_update.is_active
        )
        if not updated_playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        return updated_playlist
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating playlist: {str(e)}")

@router.delete("/{playlist_id}")
def delete_playlist(
    playlist_id: int,
    db: Session = Depends(get_db)
):
    """Delete a playlist"""
    try:
        success = crud.delete_playlist(db, playlist_id)
        if not success:
            raise HTTPException(status_code=404, detail="Playlist not found")
        return {"message": "Playlist deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting playlist: {str(e)}")

# Playlist Items endpoints
@router.post("/{playlist_id}/items", response_model=schemas.PlaylistItem)
def add_playlist_item(
    playlist_id: int,
    item: schemas.PlaylistItemCreate,
    db: Session = Depends(get_db)
):
    """Add an item to a playlist"""
    try:
        # Validate playlist exists
        playlist = crud.get_playlist(db, playlist_id)
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        db_item = crud.add_playlist_item(
            db=db,
            playlist_id=playlist_id,
            position=item.position,
            sound_id=item.sound_id,
            stream_url=item.stream_url,
            stream_name=item.stream_name
        )
        return db_item
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding playlist item: {str(e)}")

@router.get("/{playlist_id}/items", response_model=List[schemas.PlaylistItem])
def get_playlist_items(
    playlist_id: int,
    db: Session = Depends(get_db)
):
    """Get all items in a playlist"""
    try:
        # Validate playlist exists
        playlist = crud.get_playlist(db, playlist_id)
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        items = crud.get_playlist_items(db, playlist_id)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching playlist items: {str(e)}")

@router.delete("/{playlist_id}/items/{item_id}")
def delete_playlist_item(
    playlist_id: int,
    item_id: int,
    db: Session = Depends(get_db)
):
    """Delete an item from a playlist"""
    try:
        success = crud.delete_playlist_item(db, item_id)
        if not success:
            raise HTTPException(status_code=404, detail="Playlist item not found")
        return {"message": "Playlist item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting playlist item: {str(e)}")

@router.post("/{playlist_id}/reorder")
def reorder_playlist_items(
    playlist_id: int,
    item_positions: dict,
    db: Session = Depends(get_db)
):
    """Reorder playlist items
    
    Request body: {"item_id": new_position, ...}
    Example: {"1": 0, "2": 1, "3": 2}
    """
    try:
        # Validate playlist exists
        playlist = crud.get_playlist(db, playlist_id)
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        
        # Convert string keys to integers
        item_positions_int = {int(k): v for k, v in item_positions.items()}
        
        crud.reorder_playlist_items(db, playlist_id, item_positions_int)
        return {"message": "Playlist items reordered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reordering playlist items: {str(e)}")
