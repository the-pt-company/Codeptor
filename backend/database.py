import os
import logging
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR.parent / '.env')

# MongoDB connection
try:
    mongo_url = os.environ.get('MONGO_URL', 'mongodb+srv://database1:Tharunme77@cluster0.djdevrw.mongodb.net/myAppDB?retryWrites=true&w=majority')
    db_name = os.environ.get('DB_NAME', 'KudosDev')
    
    if not mongo_url:
        logger.warning("MONGO_URL not found in env, using default: mongodb+srv://database1:Tharunme77@cluster0.djdevrw.mongodb.net/myAppDB?retryWrites=true&w=majority")
    
    if not db_name:
        logger.warning("DB_NAME not found in env, using default: KudosDev")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logger.info("MongoDB client initialized")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB client: {e}")
    raise
