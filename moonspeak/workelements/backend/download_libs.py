from pathlib import Path
nltk_data_dir = Path(__file__).parent.parent / "resources" / "nltk_data"

import nltk
nltk.download('omw-1.4', download_dir=nltk_data_dir)
nltk.download('wordnet', download_dir=nltk_data_dir)
