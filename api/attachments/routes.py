"""Module de gestion des pièces jointes"""
import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from core.extensions import db
from core.models import Attachment
from core.permissions import get_current_user
from core.utils import allowed_file, save_uploaded_file
from config import Config

attachments_bp = Blueprint('attachments', __name__, url_prefix='/api/v1/attachments')


@attachments_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Uploader un fichier"""
    current_user = get_current_user()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        # Créer le dossier uploads s'il n'existe pas
        upload_folder = Config.UPLOAD_FOLDER
        os.makedirs(upload_folder, exist_ok=True)
        
        # Sauvegarder le fichier
        file_info = save_uploaded_file(file, upload_folder)
        
        if not file_info:
            return jsonify({'error': 'Failed to save file'}), 500
        
        # Créer l'entrée en base de données
        attachment = Attachment(
            filename=file_info['filename'],
            filepath=file_info['filepath'],
            mimetype=file_info['mimetype'],
            size=file_info['size'],
            uploader_id=current_user.id
        )
        
        db.session.add(attachment)
        db.session.commit()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'attachment': attachment.to_dict()
        }), 201
    
    except Exception as e:
        # Log the error for debugging but don't expose stack trace
        import logging
        logging.error(f'Upload failed: {str(e)}')
        return jsonify({'error': 'Upload failed'}), 500


@attachments_bp.route('/<int:attachment_id>', methods=['GET'])
@jwt_required()
def download_file(attachment_id):
    """Télécharger un fichier si autorisé"""
    current_user = get_current_user()
    attachment = Attachment.query.get(attachment_id)
    
    if not attachment:
        return jsonify({'error': 'Attachment not found'}), 404
    
    # Vérifier que le fichier existe
    if not os.path.exists(attachment.filepath):
        return jsonify({'error': 'File not found on disk'}), 404
    
    # Pour l'instant, autoriser le téléchargement si l'utilisateur est authentifié
    # TODO: Ajouter des vérifications de permissions plus fines
    
    return send_file(
        attachment.filepath,
        mimetype=attachment.mimetype,
        as_attachment=True,
        download_name=attachment.filename
    )
