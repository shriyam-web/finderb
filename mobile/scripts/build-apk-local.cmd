@echo off
setlocal
set MOBILE_DIR=E:\projects\FinderB Sites\FinderB\mobile
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%

subst F: /d >nul 2>&1
subst F: "%MOBILE_DIR%"
if errorlevel 1 (
  echo Failed to map F: drive
  exit /b 1
)

cd /d F:\android
echo Building release APK from %CD%
call gradlew.bat assembleRelease --no-daemon
set EXITCODE=%ERRORLEVEL%

if %EXITCODE%==0 (
  echo.
  echo APK:
  dir /b "F:\android\app\build\outputs\apk\release\*.apk"
)

exit /b %EXITCODE%
