import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, storage
from firebase_admin import firestore_async

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from backend/.env (own directory)
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Firebase
try:
    if not firebase_admin._apps:
        creds_json = os.environ.get('FIREBASE_CREDENTIALS_JSON')
        creds_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')
        
        # Get storage bucket name from env or use default
        bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET', 'kudosdev-44520.firebasestorage.app')
        
        if creds_json:
            creds_dict = json.loads(creds_json)
            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred, {
                'storageBucket': bucket_name
            })
            logger.info(f"Firebase initialized via FIREBASE_CREDENTIALS_JSON (bucket: {bucket_name})")
        elif creds_path and os.path.exists(creds_path):
            cred = credentials.Certificate(creds_path)
            firebase_admin.initialize_app(cred, {
                'storageBucket': bucket_name
            })
            logger.info(f"Firebase initialized via FIREBASE_CREDENTIALS_PATH (bucket: {bucket_name})")
        else:
            raise EnvironmentError(
                "Firebase credentials not found. "
                "Set FIREBASE_CREDENTIALS_JSON (service account JSON string) "
                "or FIREBASE_CREDENTIALS_PATH (path to service account JSON file) "
                "in your environment variables."
            )
            
    # Get async Firestore client
    db = firestore_async.client()
    # Get storage bucket
    bucket = storage.bucket()
    
    logger.info("Firestore async client and Storage bucket initialized")
except Exception as e:
    logger.error(f"Failed to initialize Firebase client: {e}")
    raise
