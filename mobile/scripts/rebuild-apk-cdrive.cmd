@echo off
setlocal
set SRC=E:\projects\FinderB Sites\FinderB\mobile
set DST=C:\fbapp
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set PATH=C:\Program Files\nodejs;%JAVA_HOME%\bin;%PATH%
set NODE_ENV=production

echo === Sync sources ===
robocopy "%SRC%\app" "%DST%\app" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%SRC%\components" "%DST%\components" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%SRC%\lib" "%DST%\lib" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%SRC%\hooks" "%DST%\hooks" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%SRC%\context" "%DST%\context" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%SRC%\constants" "%DST%\constants" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%SRC%\plugins" "%DST%\plugins" /MIR /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%SRC%\assets" "%DST%\assets" /E /NFL /NDL /NJH /NJS /nc /ns /np
copy /Y "%SRC%\app.json" "%DST%\app.json" >nul
copy /Y "%SRC%\package.json" "%DST%\package.json" >nul
copy /Y "%SRC%\package-lock.json" "%DST%\package-lock.json" >nul
copy /Y "%SRC%\.env" "%DST%\.env" >nul

echo === npm install (notifications etc) ===
cd /d "%DST%"
call npm install --no-fund --no-audit
if errorlevel 1 exit /b 1

echo === expo prebuild android ===
call npx expo prebuild --platform android --no-install
if errorlevel 1 exit /b 1

REM Keep newArch off to avoid Windows path/codegen issues
powershell -NoProfile -Command "(Get-Content '%DST%\android\gradle.properties') -replace 'newArchEnabled=true','newArchEnabled=false' | Set-Content '%DST%\android\gradle.properties'"

set SDK_ESC=%ANDROID_HOME:\=\\%
echo sdk.dir=%SDK_ESC%> "%DST%\android\local.properties"

echo === gradle assembleRelease ===
cd /d "%DST%\android"
call gradlew.bat assembleRelease --no-daemon
set ERR=%ERRORLEVEL%

if exist "%DST%\android\app\build\outputs\apk\release\app-release.apk" (
  if not exist "%SRC%\dist" mkdir "%SRC%\dist"
  copy /Y "%DST%\android\app\build\outputs\apk\release\app-release.apk" "%SRC%\dist\FinderB-release.apk"
  echo.
  echo APK: %SRC%\dist\FinderB-release.apk
  dir "%SRC%\dist\FinderB-release.apk"
)

exit /b %ERR%
