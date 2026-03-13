import os
import logging
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient # type: ignore
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from backend/.env (own directory)
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
try:
    # Read from env first, then fall back to default
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')

    if not mongo_url:
        logger.warning("MONGO_URL not found in env, using default")
        mongo_url = 'mongodb+srv://database1:Tharunme77@cluster0.djdevrw.mongodb.net/KudosDev?retryWrites=true&w=majority'

    if not db_name:
        logger.warning("DB_NAME not found in env, using default: KudosDev")
        db_name = 'KudosDev'

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logger.info("MongoDB client initialized")
except Exception as e:  # type: ignore
    logger.error(f"Failed to initialize MongoDB client: {e}")
    raise
