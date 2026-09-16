@echo off
setlocal
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if not defined JAVA_HOME set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
if not exist "%JAVA_HOME%" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "NODE_ENV=production"
set "PATH=C:\Program Files\nodejs;%PATH%"

set "MOBILE=E:\projects\FinderB Sites\FinderB\mobile"
cd /d "%MOBILE%\android" || exit /b 1

call gradlew.bat assembleRelease --no-daemon -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
set "ERR=%ERRORLEVEL%"

if exist "%MOBILE%\android\app\build\outputs\apk\release\app-release.apk" (
  if not exist "%MOBILE%\dist" mkdir "%MOBILE%\dist"
  copy /Y "%MOBILE%\android\app\build\outputs\apk\release\app-release.apk" "%MOBILE%\dist\FinderB-release.apk" >nul
  echo.
  echo APK: %MOBILE%\dist\FinderB-release.apk
)

exit /b %ERR%
