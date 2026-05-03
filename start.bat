@echo off
REM Cortex one-command boot for Windows (cmd).
REM Tries `py -3` first, then falls back to `python`.
where py >nul 2>nul
if %ERRORLEVEL% == 0 (
    py -3 "%~dp0scripts\start.py" %*
) else (
    python "%~dp0scripts\start.py" %*
)
