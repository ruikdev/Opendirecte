"""Utilitaires divers pour OpenDirecte"""
import os
from datetime import datetime
from werkzeug.utils import secure_filename


def allowed_file(filename, allowed_extensions=None):
    """Vérifie si le fichier a une extension autorisée"""
    if allowed_extensions is None:
        allowed_extensions = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'zip'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def save_uploaded_file(file, upload_folder):
    """Sauvegarde un fichier uploadé et retourne les informations"""
    if file and file.filename:
        filename = secure_filename(file.filename)
        # Ajouter un timestamp pour éviter les collisions
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{timestamp}{ext}"
        
        filepath = os.path.join(upload_folder, unique_filename)
        file.save(filepath)
        
        return {
            'filename': filename,
            'filepath': filepath,
            'mimetype': file.content_type,
            'size': os.path.getsize(filepath)
        }
    return None


def validate_date(date_string):
    """Valide et convertit une chaîne de date en datetime"""
    try:
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return None
