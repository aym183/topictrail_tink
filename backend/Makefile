.PHONY: install run test clean

# Variables
PYTHON_CMD := $(shell which python3 2>/dev/null || which python)
VENV = venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip

# Create virtual environment and install dependencies
install:
	$(PYTHON_CMD) -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

# Run the FastAPI server
run:
	$(PYTHON) -m uvicorn main:app --reload

# Clean up generated files and virtual environment
clean:
	rm -rf $(VENV)
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
