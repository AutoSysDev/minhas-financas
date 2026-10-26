@echo off
echo Starting Monely Finance Import Server...
cd python
python -m pip install -r requirements.txt
python server.py
pause