from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from sqlalchemy.orm import Session
import crud, models
from database import SessionLocal
from datetime import datetime, date, time
import subprocess
import os
import logging
from typing import Optional
import threading
import time as time_module

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BellScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        self.is_running = False
        self.current_jobs = {}
        self._is_muted = False
        self.ntp_sync_job = None
        
    def start(self):
        """Start the scheduler"""
        if not self.is_running:
            self.is_running = True
            logger.info("Starting bell scheduler...")
            self._schedule_all_events()
            self._schedule_ntp_sync()
            
            # List all scheduled jobs
            jobs = self.scheduler.get_jobs()
            logger.info(f"Bell scheduler started with {len(jobs)} jobs")
            for job in jobs:
                logger.info(f"Job: {job.id} - Next run: {job.next_run_time}")
            
            logger.info("Bell scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        if self.is_running:
            self.is_running = False
            try:
                # Clear all jobs before shutdown to avoid removal errors
                self.scheduler.remove_all_jobs()
                self.scheduler.shutdown(wait=False)
                logger.info("Bell scheduler stopped")
            except Exception as e:
                logger.warning(f"Error during scheduler shutdown: {e}")
                # Force shutdown if graceful shutdown fails
                try:
                    self.scheduler.shutdown(wait=False)
                except:
                    pass
    
    def _get_db(self):
        """Get database session"""
        return SessionLocal()
    
    def _schedule_all_events(self):
        """Schedule all active events"""
        if self._is_muted:
            logger.info("Scheduler is muted, not scheduling any events")
            return
            
        db = self._get_db()
        try:
            # Get all schedules
            schedules = crud.get_schedules(db)
            
            for schedule in schedules:
                if schedule.is_active and not schedule.is_muted:
                    self._schedule_weekly_events(schedule)
            
            # Schedule special events
            self._schedule_special_events()
            
        except Exception as e:
            logger.error(f"Error scheduling events: {e}")
        finally:
            db.close()
    
    def _schedule_weekly_events(self, schedule):
        """Schedule events for a specific schedule"""
        db = self._get_db()
        try:
            for day in schedule.days:
                if day.is_active:
                    for event in day.events:
                        if event.is_active:
                            self._schedule_event(event, day.day_of_week)
        except Exception as e:
            logger.error(f"Error scheduling weekly events for schedule {schedule.id}: {e}")
        finally:
            db.close()
    
    def _schedule_event(self, event, day_of_week):
        """Schedule a single event"""
        job_id = f"event_{event.id}"
        
        # Remove existing job if it exists
        if job_id in self.current_jobs:
            try:
                self.scheduler.remove_job(job_id)
            except:
                pass
        
        # Create cron trigger for weekly recurrence
        trigger = CronTrigger(
            day_of_week=day_of_week,
            hour=event.time.hour,
            minute=event.time.minute,
            second=event.time.second
        )
        
        # Add job to scheduler
        self.scheduler.add_job(
            func=self._trigger_event,
            trigger=trigger,
            args=[event.id],
            id=job_id,
            replace_existing=True
        )
        
        self.current_jobs[job_id] = event.id
        logger.info(f"Scheduled event {event.id} for {event.time} on day {day_of_week}")
        logger.info(f"Job ID: {job_id}, Trigger: {trigger}")
        
        # List all scheduled jobs for debugging
        jobs = self.scheduler.get_jobs()
        logger.info(f"Total scheduled jobs: {len(jobs)}")
        for job in jobs:
            logger.info(f"Job: {job.id} - {job.name} - Next run: {job.next_run_time}")
    
    def _schedule_special_events(self):
        """Schedule special events for specific dates"""
        db = self._get_db()
        try:
            # Get special schedules for the next 30 days
            from datetime import timedelta
            start_date = date.today()
            end_date = start_date + timedelta(days=30)
            
            special_schedules = crud.get_special_schedules(db, start_date, end_date)
            
            for special in special_schedules:
                if special.is_active:
                    schedule = crud.get_schedule(db, special.schedule_id)
                    if schedule and schedule.is_active and not schedule.is_muted:
                        # Iterate through scheduled dates for this special schedule
                        for scheduled_date in special.scheduled_dates:
                            self._schedule_special_day(scheduled_date, schedule)
                        
        except Exception as e:
            logger.error(f"Error scheduling special events: {e}")
        finally:
            db.close()
    
    def _schedule_special_day(self, scheduled_date_obj, schedule):
        """Schedule events for a special day"""
        db = self._get_db()
        try:
            # Get the day of week for the special date
            day_of_week = scheduled_date_obj.date.weekday()
            
            # Find the corresponding schedule day
            schedule_day = None
            for day in schedule.days:
                if day.day_of_week == day_of_week:
                    schedule_day = day
                    break
            
            if schedule_day and schedule_day.is_active:
                for event in schedule_day.events:
                    if event.is_active:
                        self._schedule_special_event(event, scheduled_date_obj.date)
                        
        except Exception as e:
            logger.error(f"Error scheduling special day {scheduled_date_obj.date}: {e}")
        finally:
            db.close()
    
    def _schedule_special_event(self, event, target_date):
        """Schedule a single special event"""
        job_id = f"special_event_{event.id}_{target_date}"
        
        # Remove existing job if it exists
        if job_id in self.current_jobs:
            try:
                self.scheduler.remove_job(job_id)
            except:
                pass
        
        # Create date trigger for specific date
        trigger = DateTrigger(
            run_date=datetime.combine(target_date, event.time)
        )
        
        # Add job to scheduler
        self.scheduler.add_job(
            func=self._trigger_event,
            trigger=trigger,
            args=[event.id],
            id=job_id,
            replace_existing=True
        )
        
        self.current_jobs[job_id] = event.id
        logger.info(f"Scheduled special event {event.id} for {target_date} at {event.time}")
    
    def _trigger_event(self, event_id):
        """Trigger an audio event"""
        logger.info(f"=== SCHEDULER TRIGGER EVENT CALLED: {event_id} ===")
        db = self._get_db()
        try:
            event = crud.get_bell_event(db, event_id)
            if not event or not event.is_active:
                logger.warning(f"Event {event_id} not found or not active")
                return
            
            # Check if the schedule is muted
            schedule_day = crud.get_schedule_day(db, event.schedule_day_id)
            if not schedule_day:
                logger.warning(f"Schedule day not found for event {event_id}")
                return
            
            schedule = crud.get_schedule(db, schedule_day.schedule_id)
            if not schedule or schedule.is_muted:
                logger.warning(f"Schedule not found or muted for event {event_id}")
                return
            
            logger.info(f"Triggering event {event_id} at {datetime.now()}")
            logger.info(f"Event details: sound_id={event.sound_id}, tts_text={event.tts_text}")
            
            # Play audio based on event type
            if event.sound_id:
                logger.info(f"Playing sound for event {event_id}")
                self._play_sound(event.sound)
            elif event.tts_text:
                logger.info(f"Playing TTS for event {event_id}")
                self._play_tts(event.tts_text)
            else:
                logger.warning(f"No sound or TTS for event {event_id}")
                
        except Exception as e:
            logger.error(f"Error triggering event {event_id}: {e}")
        finally:
            db.close()
    
    def _play_sound(self, sound):
        """Play an audio file using the same logic as audio library"""
        try:
            if sound and sound.file_path and os.path.exists(sound.file_path):
                # Get audio settings for volume and output device
                audio_settings = self._get_audio_settings()
                logger.info(f"Audio settings for scheduler: {audio_settings}")
                
                # Apply EQ if needed (same as audio library)
                playback_file = sound.file_path
                if audio_settings.get('eq'):
                    eq_settings = audio_settings['eq']
                    logger.info(f"EQ settings found: {eq_settings}")
                    # Check if any EQ settings are non-zero
                    eq_values = [float(v) for v in eq_settings.values()]
                    logger.info(f"EQ values: {eq_values}")
                    if any(v != 0 for v in eq_values):
                        logger.info(f"Applying EQ settings: {eq_settings}")
                        playback_file = self._apply_eq_to_audio(sound.file_path, eq_settings)
                        logger.info(f"EQ processed file: {playback_file}")
                    else:
                        logger.info("No EQ settings to apply (all values are 0)")
                else:
                    logger.info("No EQ settings found in audio_settings")
                
                # Use the same player logic as audio library
                file_extension = os.path.splitext(playback_file)[1].lower()
                logger.info(f"Playing file: {playback_file}, extension: {file_extension}")
                
                # Build player command with audio settings (same logic as audio library)
                def build_player_command(player, file_path):
                    base_cmd = [player]
                    
                    # Add volume control
                    if audio_settings.get('volume') and audio_settings['volume'] != '100':
                        volume = int(audio_settings['volume'])
                        if player == 'mpg123':
                            base_cmd.extend(['-g', str(volume * 2)])  # mpg123 uses 0-200 scale
                        elif player == 'ffplay':
                            base_cmd.extend(['-volume', str(volume)])
                        elif player == 'mpv':
                            base_cmd.extend(['--volume', str(volume)])
                        elif player == 'paplay':
                            # paplay doesn't support volume directly
                            pass
                        logger.info(f"Applied volume: {volume}% to {player}")
                    else:
                        logger.info(f"No volume adjustment needed for {player}")
                    
                    # Add output device if specified
                    if audio_settings.get('output') and audio_settings['output'] != 'default':
                        output = audio_settings['output']
                        if player == 'mpg123' and output.startswith('alsa_card_'):
                            # Extract card and device from output ID
                            parts = output.split('_')
                            if len(parts) >= 4:
                                card = parts[2]
                                device = parts[4]
                                base_cmd.extend(['-a', f"hw:{card},{device}"])
                        elif player == 'ffplay':
                            base_cmd.extend(['-f', 'alsa', '-i', output])
                        elif player == 'aplay':
                            # aplay uses different device syntax
                            if output.startswith('alsa_card_'):
                                parts = output.split('_')
                                if len(parts) >= 4:
                                    card = parts[2]
                                    device = parts[4]
                                    base_cmd.extend(['-D', f"hw:{card},{device}"])
                    
                    base_cmd.append(file_path)
                    return base_cmd
                
                # Prioritize players based on file type (same as audio library)
                if file_extension in ['.mp3', '.m4a', '.aac']:
                    players = ['mpg123', 'ffplay', 'mpv', 'paplay', 'aplay']
                else:
                    players = ['aplay', 'paplay', 'ffplay', 'mpg123', 'mpv']
                
                # Try each player until one works (same as audio library)
                for i, player in enumerate(players):
                    try:
                        player_cmd = build_player_command(player, playback_file)
                        logger.info(f"Trying player {i+1}: {' '.join(player_cmd)}")
                        process = subprocess.Popen(player_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        logger.info(f"Successfully started playback with: {' '.join(player_cmd)}")
                        return  # Success, exit the function
                    except FileNotFoundError:
                        logger.warning(f"Player not found: {player}")
                        continue
                    except Exception as e:
                        logger.warning(f"Error with player {player}: {e}")
                        continue
                
                # If we get here, no player worked
                logger.error(f"Failed to play {sound.name} with any available player")
                
            else:
                logger.warning(f"Sound file not found: {sound.file_path if sound else 'None'}")
        except Exception as e:
            logger.error(f"Error playing sound: {e}")
    
    def _apply_eq_to_audio(self, input_file, eq_settings):
        """Apply EQ to audio file using ffmpeg (same as audio library)"""
        try:
            import tempfile
            import subprocess
            
            logger.info(f"Starting EQ processing for {input_file}")
            logger.info(f"EQ settings: {eq_settings}")
            
            # Create temporary output file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                output_file = tmp_file.name
            
            # Build ffmpeg command with EQ filters
            cmd = [
                'ffmpeg', '-i', input_file, '-y',
                '-af', f"equalizer=f=60:width_type=o:width=2:g={eq_settings.get('bass', 0)},"
                       f"equalizer=f=8000:width_type=o:width=2:g={eq_settings.get('treble', 0)},"
                       f"equalizer=f=100:width_type=o:width=2:g={eq_settings.get('low', 0)},"
                       f"equalizer=f=1000:width_type=o:width=2:g={eq_settings.get('mid', 0)},"
                       f"equalizer=f=8000:width_type=o:width=2:g={eq_settings.get('high', 0)}",
                output_file
            ]
            
            logger.info(f"Running ffmpeg command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("EQ processing successful")
                return output_file
            else:
                logger.error(f"EQ processing failed: {result.stderr}")
                return input_file  # Return original file if EQ fails
                
        except Exception as e:
            logger.error(f"Error applying EQ: {e}")
            return input_file  # Return original file if EQ fails
    
    def _get_audio_settings(self):
        """Get audio settings from database"""
        try:
            db = self._get_db()
            # Import here to avoid circular imports
            from api.sound import get_audio_settings_from_db
            settings = get_audio_settings_from_db(db)
            logger.info(f"Retrieved audio settings from database: {settings}")
            db.close()
            return settings
        except Exception as e:
            logger.error(f"Error getting audio settings: {e}")
            return {}
    
    def _play_tts(self, text):
        """Play TTS audio"""
        try:
            # Generate TTS audio using piper
            tts_file = self._generate_tts(text)
            if tts_file:
                self._play_sound_file(tts_file)
                # Clean up temporary file
                os.remove(tts_file)
        except Exception as e:
            logger.error(f"Error playing TTS: {e}")
    
    def _generate_tts(self, text):
        """Generate TTS audio file"""
        try:
            import uuid
            output_name = f"tts_{uuid.uuid4().hex[:8]}.wav"
            output_path = f"static/sounds/{output_name}"
            
            piper_path = os.path.abspath("piper/piper")
            voice_path = os.path.abspath("piper/en_US-amy-medium.onnx")
            
            cmd = [
                piper_path,
                "--model", voice_path,
                "--output_file", output_path,
                "--sentence", text
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                return output_path
            else:
                logger.error(f"TTS generation failed: {result.stderr}")
                return None
        except Exception as e:
            logger.error(f"Error generating TTS: {e}")
            return None
    
    def _play_sound_file(self, file_path):
        """Play a sound file using aplay"""
        try:
            subprocess.Popen([
                'aplay', 
                '-q',
                file_path
            ])
            logger.info(f"Playing TTS file: {file_path}")
        except Exception as e:
            logger.error(f"Error playing sound file: {e}")
    
    def refresh_schedule(self):
        """Refresh the entire schedule"""
        logger.info("Refreshing schedule...")
        
        # Clear all existing jobs
        self.scheduler.remove_all_jobs()
        self.current_jobs.clear()
        
        # Reschedule all events
        self._schedule_all_events()
        
        # Refresh NTP sync configuration
        self._schedule_ntp_sync()
        
        logger.info("Schedule refreshed")
    
    def get_next_event(self):
        """Get information about the next scheduled event"""
        db = self._get_db()
        try:
            next_event = crud.get_next_event(db)
            
            if next_event and hasattr(next_event, 'time') and hasattr(next_event, 'scheduled_date'):
                # Calculate minutes until event
                now = datetime.now()
                event_datetime = datetime.combine(next_event.scheduled_date, next_event.time)
                minutes_until = int((event_datetime - now).total_seconds() / 60)
                
                # Ensure all required fields are present
                result = {
                    "time": str(next_event.time),
                    "sound_name": None,
                    "tts_text": next_event.tts_text if hasattr(next_event, 'tts_text') else None,
                    "description": next_event.description if hasattr(next_event, 'description') else None,
                    "scheduled_date": next_event.scheduled_date.isoformat(),
                    "days_from_now": next_event.days_from_now if hasattr(next_event, 'days_from_now') else 0,
                    "minutes_until": max(0, minutes_until)  # Ensure non-negative
                }
                
                # Add sound name if available
                if hasattr(next_event, 'sound') and next_event.sound:
                    result["sound_name"] = next_event.sound.name
                
                logger.info(f"Next event data: {result}")
                return result
            else:
                logger.info("No next event found")
                return None
        except Exception as e:
            logger.error(f"Error getting next event: {e}")
            return None
        finally:
            db.close()
    
    def mute_all(self, mute: bool):
        """Mute or unmute all schedules"""
        self._is_muted = mute
        db = self._get_db()
        try:
            schedules = crud.get_schedules(db)
            for schedule in schedules:
                crud.mute_schedule(db, schedule.id, mute)
            
            if mute:
                logger.info("All schedules muted")
            else:
                logger.info("All schedules unmuted")
                
            # Refresh schedule to apply changes
            self.refresh_schedule()
            
        except Exception as e:
            logger.error(f"Error muting schedules: {e}")
        finally:
            db.close()

    def _schedule_ntp_sync(self):
        """Schedule periodic NTP synchronization"""
        try:
            # Remove existing NTP sync job if it exists
            if self.ntp_sync_job:
                try:
                    self.scheduler.remove_job(self.ntp_sync_job)
                except:
                    pass
            
            # Get NTP settings from database
            db = self._get_db()
            try:
                ntp_enabled = crud.get_system_setting(db, 'ntp_enabled')
                ntp_sync_interval = crud.get_system_setting(db, 'ntp_sync_interval')
                db.close()
                
                if ntp_enabled == 'True' and ntp_sync_interval:
                    try:
                        interval_seconds = int(ntp_sync_interval)
                        # Schedule NTP sync job
                        self.ntp_sync_job = self.scheduler.add_job(
                            self._sync_with_ntp,
                            'interval',
                            seconds=interval_seconds,
                            id='ntp_sync',
                            name='NTP Time Synchronization'
                        )
                        logger.info(f"NTP sync scheduled every {interval_seconds} seconds")
                    except ValueError:
                        logger.warning(f"Invalid NTP sync interval: {ntp_sync_interval}")
                else:
                    logger.info("NTP sync not enabled or no interval configured")
                    
            except Exception as e:
                logger.error(f"Error configuring NTP sync: {e}")
                db.close()
                
        except Exception as e:
            logger.error(f"Error scheduling NTP sync: {e}")

    def _sync_with_ntp(self):
        """Synchronize time with NTP servers"""
        try:
            import ntplib
            import time
            
            # Get NTP settings from database
            db = self._get_db()
            try:
                ntp_servers = crud.get_system_setting(db, 'ntp_servers')
                db.close()
                
                if not ntp_servers:
                    logger.warning("No NTP servers configured")
                    return
                
                # Parse NTP servers (comma-separated)
                server_list = [s.strip() for s in ntp_servers.split(',') if s.strip()]
                
                # Try to sync with first available server
                ntp_client = ntplib.NTPClient()
                sync_result = None
                
                for server in server_list:
                    try:
                        response = ntp_client.request(server, timeout=3)
                        offset = response.offset
                        delay = response.delay
                        
                        sync_result = {
                            "server": server,
                            "offset": offset,
                            "delay": delay,
                            "timestamp": time.time()
                        }
                        
                        logger.info(f"NTP sync successful with {server}: offset={offset:.3f}s, delay={delay:.3f}s")
                        break
                        
                    except Exception as e:
                        logger.warning(f"Failed to sync with NTP server {server}: {e}")
                        continue
                
                if sync_result:
                    # Store the sync result for reference
                    db = self._get_db()
                    try:
                        crud.set_system_setting(db, 'last_ntp_sync', str(sync_result))
                        db.close()
                    except:
                        db.close()
                else:
                    logger.error("Could not sync with any NTP server")
                    
            except Exception as e:
                logger.error(f"Error during NTP sync: {e}")
                db.close()
                
        except ImportError:
            logger.warning("ntplib not installed. Install with: pip install ntplib")
        except Exception as e:
            logger.error(f"Error during NTP sync: {e}")

    def refresh_ntp_sync(self):
        """Refresh NTP sync configuration"""
        logger.info("Refreshing NTP sync configuration...")
        self._schedule_ntp_sync()
        logger.info("NTP sync configuration refreshed")

    @property
    def is_muted(self):
        """Check if the scheduler is muted"""
        return self._is_muted
    
    @is_muted.setter
    def is_muted(self, value):
        """Set the muted state"""
        self._is_muted = value

    @property
    def ntp_enabled(self):
        """Check if NTP is enabled"""
        try:
            db = self._get_db()
            ntp_enabled = crud.get_system_setting(db, 'ntp_enabled')
            db.close()
            return ntp_enabled == 'True'
        except:
            return False

# Global scheduler instance
bell_scheduler = BellScheduler()