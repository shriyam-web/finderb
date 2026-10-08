@echo off
setlocal
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if not defined JAVA_HOME set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
if not exist "%JAVA_HOME%" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "NODE_ENV=production"
rem Release bundles must use mobile/.env, not dev overrides such as a localhost API URL.
for /f "delims==" %%V in ('set EXPO_PUBLIC_ 2^>nul') do set "%%V="
set "PATH=C:\Program Files\nodejs;%PATH%"

set "MOBILE=E:\projects\FinderB Sites\FinderB\mobile"
cd /d "%MOBILE%\android" || exit /b 1

rem Gradle does not treat env changes as bundle inputs, so always rebuild the JS bundle.
for %%D in (generated\assets\react\release generated\res\react\release generated\sourcemaps\react\release intermediates\sourcemaps\react\release) do (
  if exist "%MOBILE%\android\app\build\%%D" rmdir /s /q "%MOBILE%\android\app\build\%%D"
)

call gradlew.bat assembleRelease --no-daemon -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
set "ERR=%ERRORLEVEL%"

if exist "%MOBILE%\android\app\build\outputs\apk\release\app-release.apk" (
  if not exist "%MOBILE%\dist" mkdir "%MOBILE%\dist"
  copy /Y "%MOBILE%\android\app\build\outputs\apk\release\app-release.apk" "%MOBILE%\dist\FinderB-release.apk" >nul
  echo.
  echo APK: %MOBILE%\dist\FinderB-release.apk
)

exit /b %ERR%
