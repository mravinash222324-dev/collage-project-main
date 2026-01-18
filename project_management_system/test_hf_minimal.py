import logging
import sys
import os

# Setup Logger
logger = logging.getLogger('MinimalTest')
logger.setLevel(logging.INFO)
fh = logging.FileHandler(r'c:\Users\nanda\avinash\project_management_system\minimal_test_output.txt', mode='w', encoding='utf-8')
logger.addHandler(fh)

logger.info("Starting Minimal Test...")

try:
    logger.info("Importing sentence_transformers...")
    from sentence_transformers import SentenceTransformer, util
    logger.info("Import successful.")
    
    logger.info("Loading model 'all-MiniLM-L6-v2'...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Model loaded successfully.")
    
    logger.info("Testing encoding...")
    emb = model.encode("This is a test.")
    logger.info(f"Encoding successful. Shape: {emb.shape}")
    
except Exception as e:
    logger.info(f"Error: {e}")
    import traceback
    logger.info(traceback.format_exc())

logger.info("Test Complete.")
