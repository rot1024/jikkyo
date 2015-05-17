@echo off
if exist "%~dp0jikkyo.exe" (
  start "" "%~dp0jikkyo.exe" --disable-gpu --force-cpu-draw
) else (
  start "" cmd /c ""%~dp0..\node_modules\.bin\nw" "%~dp0..\src" --disable-gpu --force-cpu-draw"
)
