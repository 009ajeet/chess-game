@echo off
cd /d "c:\Users\91807\Desktop\chess game"
echo Current status:
git status
echo.
echo Adding files...
git add .
echo.
echo Committing...
git commit -m "Fix Firebase deployment"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo Done! Check GitHub Actions for deployment status.
pause
