"""Source resources and existing repository-local data use separate locations."""
from pathlib import Path

SOURCE_DIR = Path(__file__).resolve().parent
REPOSITORY_ROOT = SOURCE_DIR.parents[1]
