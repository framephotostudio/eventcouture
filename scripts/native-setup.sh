#!/usr/bin/env bash
# Native settings applied after `npx cap add ios|android` (icons, splash, permissions, orientation, version).
set -euo pipefail
PLATFORM="$1"
npx --yes @capacitor/assets generate --"$PLATFORM" \
  --iconBackgroundColor '#F3E2C3' --iconBackgroundColorDark '#F3E2C3' \
  --splashBackgroundColor '#F3E2C3' --splashBackgroundColorDark '#F3E2C3'

if [ "$PLATFORM" = "ios" ]; then
  PL=ios/App/App/Info.plist
  pb() { /usr/libexec/PlistBuddy -c "$1" "$PL" 2>/dev/null || true; }
  setstr() { pb "Delete :$1"; pb "Add :$1 string $2"; }
  setstr NSPhotoLibraryUsageDescription "Event Couture opens the inspiration photos you choose so it can plan your event around them. Photos stay on your phone."
  setstr NSCameraUsageDescription "Event Couture can use the camera so you can snap inspiration, like a cake or a centerpiece you love. Photos stay on your phone."
  setstr CFBundleDisplayName "Event Couture"
  pb "Delete :ITSAppUsesNonExemptEncryption"; pb "Add :ITSAppUsesNonExemptEncryption bool false"
  pb "Delete :UIRequiresFullScreen"; pb "Add :UIRequiresFullScreen bool true"
  pb "Delete :UISupportedInterfaceOrientations"; pb "Add :UISupportedInterfaceOrientations array"; pb "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait"
  pb "Delete :UIStatusBarStyle"; pb "Add :UIStatusBarStyle string UIStatusBarStyleDarkContent"
  pb "Delete :UIViewControllerBasedStatusBarAppearance"; pb "Add :UIViewControllerBasedStatusBarAppearance bool true"
  sed -i '' 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' ios/App/App.xcodeproj/project.pbxproj
  if [ -n "${APP_VERSION:-}" ]; then
    sed -i '' "s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = ${APP_VERSION};/g; s/CURRENT_PROJECT_VERSION = [^;]*;/CURRENT_PROJECT_VERSION = ${BUILD_NUMBER:-1};/g" ios/App/App.xcodeproj/project.pbxproj
  fi
  echo "iOS Info.plist:"; cat "$PL"
fi

if [ "$PLATFORM" = "android" ]; then
  MF=android/app/src/main/AndroidManifest.xml
  sed -i 's/android:name=".MainActivity"/android:name=".MainActivity"\n            android:screenOrientation="portrait"/' "$MF"
  GR=android/app/build.gradle
  if [ -n "${APP_VERSION:-}" ]; then
    sed -i "s/versionCode [0-9]*/versionCode ${BUILD_NUMBER:-1}/; s/versionName \"[^\"]*\"/versionName \"${APP_VERSION}\"/" "$GR"
  fi
  echo "AndroidManifest:"; cat "$MF"
fi
