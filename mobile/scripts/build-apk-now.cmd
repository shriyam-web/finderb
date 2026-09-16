@echo off
setlocal
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set PATH=C:\Program Files\nodejs;%JAVA_HOME%\bin;%PATH%
set NODE_ENV=production

subst F: /D >nul 2>&1
subst F: "E:\projects\FinderB Sites\FinderB\mobile"
if errorlevel 1 (
  echo SUBST failed
  exit /b 1
)

cd /d F:\android || exit /b 1

echo === node resolve check ===
node --print "require.resolve('expo/package.json')"
if errorlevel 1 exit /b 1

echo === gradle assembleRelease ===
call gradlew.bat assembleRelease --no-daemon --stacktrace
set ERR=%ERRORLEVEL%

if exist "F:\android\app\build\outputs\apk\release\app-release.apk" (
  if not exist "E:\projects\FinderB Sites\FinderB\mobile\dist" mkdir "E:\projects\FinderB Sites\FinderB\mobile\dist"
  copy /Y "F:\android\app\build\outputs\apk\release\app-release.apk" "E:\projects\FinderB Sites\FinderB\mobile\dist\FinderB-release.apk"
  echo APK copied to mobile\dist\FinderB-release.apk
)

exit /b %ERR%
