@echo off
echo Starting MongoDB Server on port 27017...
if not exist "c:\Porulon-Project\mongodb-data" mkdir "c:\Porulon-Project\mongodb-data"
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "c:\Porulon-Project\mongodb-data" --port 27017
